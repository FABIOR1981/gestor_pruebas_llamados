// Interfaz con los JSON de bd/pruebas_llamados (areas, cargos y dinamicas).
// Variables de entorno en Netlify: GITHUB_TOKEN_PRUEBAS, CLAVE_PRUEBAS (opcionales: PRUEBAS_REPO, PRUEBAS_RUTA)
const crypto = require('crypto');
const REPO = process.env.PRUEBAS_REPO || 'FABIOR1981/bd';
const RUTA = process.env.PRUEBAS_RUTA || 'pruebas_llamados';
const RAMA = 'main';
const ARCHIVOS = ['areas', 'cargos', 'dinamicas'];

const cab = () => ({ Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + process.env.GITHUB_TOKEN_PRUEBAS, 'User-Agent': 'gestor-pruebas' });
const resp = (c, o) => ({ statusCode: c, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(o) });
const igual = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const claveOk = c => process.env.CLAVE_PRUEBAS && igual(c || '', process.env.CLAVE_PRUEBAS);
const urlArchivo = n => `https://api.github.com/repos/${REPO}/contents/${RUTA}/${n}.json`;
const esObjeto = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const baseValida = b => esObjeto(b) && esObjeto(b.areas) && esObjeto(b.cargos) && Array.isArray(b.dinamicas);

async function leerArchivo(nombre) {
  const r = await fetch(`${urlArchivo(nombre)}?ref=${RAMA}`, { headers: cab() });
  if (r.status === 404) return { falta: true };
  if (!r.ok) throw new Error('GitHub respondió ' + r.status + ' al leer ' + nombre + '.json');
  const m = await r.json();
  return { sha: m.sha, datos: JSON.parse(Buffer.from(m.content, 'base64').toString('utf8')) };
}

async function leerTodo() {
  const partes = await Promise.all(ARCHIVOS.map(leerArchivo));
  if (partes.some(p => p.falta)) return resp(404, { error: `Faltan archivos en ${REPO}/${RUTA}` });
  return resp(200, Object.fromEntries(ARCHIVOS.map((n, i) => [n, partes[i].datos])));
}

async function guardarTodo(base) {
  const escritos = [];
  for (const nombre of ARCHIVOS) {
    const actual = await leerArchivo(nombre);
    const contenido = JSON.stringify(base[nombre], null, 4) + '\n';
    if (!actual.falta && JSON.stringify(actual.datos) === JSON.stringify(base[nombre])) continue;
    const put = await fetch(urlArchivo(nombre), {
      method: 'PUT', headers: { ...cab(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `pruebas_llamados: actualizar ${nombre}.json`, content: Buffer.from(contenido).toString('base64'), branch: RAMA, ...(actual.falta ? {} : { sha: actual.sha }) })
    });
    if (!put.ok) throw new Error(`No se pudo guardar ${nombre}.json (GitHub ${put.status})`);
    escritos.push(nombre);
  }
  return resp(200, { ok: true, escritos });
}

exports.handler = async (ev) => {
  try {
    if (!process.env.GITHUB_TOKEN_PRUEBAS) return resp(500, { error: 'Falta la variable GITHUB_TOKEN_PRUEBAS en Netlify' });
    if (ev.httpMethod === 'GET') return await leerTodo();
    if (ev.httpMethod !== 'POST') return resp(405, { error: 'Método no permitido' });

    const cuerpo = JSON.parse(ev.body || '{}');
    if (!claveOk(cuerpo.clave)) return resp(401, { error: 'Clave inválida' });
    if (!baseValida(cuerpo.base)) return resp(400, { error: 'Datos inválidos' });
    return await guardarTodo(cuerpo.base);
  } catch (e) {
    return resp(500, { error: e.message || 'Error del servidor' });
  }
};
