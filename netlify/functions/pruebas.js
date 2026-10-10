// Interfaz con los JSON de bd/pruebas_llamados (areas, cargos y dinamicas).
// Variables de entorno en Netlify: GITHUB_TOKEN_PRUEBAS_LLAMADOS_BD y CLAVE_PRUEBAS.
const crypto = require('crypto');
const REPO = 'FABIOR1981/bd';
const RUTA = 'pruebas_llamados';
const RAMA = 'main';
const ARCHIVOS = ['areas', 'cargos', 'dinamicas'];
const INDICE = 'informes'; // informes.json: índice liviano; cada informe completo vive en informes/<código>.json

const cab = (conToken = false) => ({
  Accept: 'application/vnd.github+json',
  'User-Agent': 'gestor-pruebas',
  ...(conToken ? { Authorization: 'Bearer ' + process.env.GITHUB_TOKEN_PRUEBAS_LLAMADOS_BD } : {})
});
const resp = (c, o) => ({ statusCode: c, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(o) });
const igual = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
// La contraseña (CLAVE_PRUEBAS) se exige para leer y para guardar. Sin la variable configurada en Netlify, todo queda bloqueado.
const claveOk = c => Boolean(process.env.CLAVE_PRUEBAS) && igual(c || '', process.env.CLAVE_PRUEBAS);
const urlArchivo = n => `https://api.github.com/repos/${REPO}/contents/${RUTA}/${n}.json`;
const esObjeto = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const baseValida = b => esObjeto(b) && esObjeto(b.areas) && esObjeto(b.cargos) && Array.isArray(b.dinamicas);

async function leerArchivo(nombre, conToken = false) {
  const r = await fetch(`${urlArchivo(nombre)}?ref=${RAMA}`, { headers: cab(conToken) });
  if (r.status === 404) return { falta: true };
  if (r.status === 401) throw new Error('GitHub rechazó GITHUB_TOKEN_PRUEBAS_LLAMADOS_BD al leer ' + nombre + '.json. Verifica que el token de Netlify sea válido y tenga acceso al repositorio bd.');
  if (!r.ok) throw new Error('GitHub respondió ' + r.status + ' al leer ' + nombre + '.json');
  const m = await r.json();
  return { sha: m.sha, datos: JSON.parse(Buffer.from(m.content, 'base64').toString('utf8')) };
}

async function leerTodo() {
  const partes = await Promise.all(ARCHIVOS.map(nombre => leerArchivo(nombre, Boolean(process.env.GITHUB_TOKEN_PRUEBAS_LLAMADOS_BD))));
  if (partes.some(p => p.falta)) return resp(404, { error: `Faltan archivos en ${REPO}/${RUTA}` });
  return resp(200, Object.fromEntries(ARCHIVOS.map((n, i) => [n, partes[i].datos])));
}

async function guardarTodo(base) {
  const escritos = [];
  for (const nombre of ARCHIVOS) {
    const actual = await leerArchivo(nombre, true);
    const contenido = JSON.stringify(base[nombre], null, 4) + '\n';
    if (!actual.falta && JSON.stringify(actual.datos) === JSON.stringify(base[nombre])) continue;
    const put = await fetch(urlArchivo(nombre), {
      method: 'PUT', headers: { ...cab(true), 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `pruebas_llamados: actualizar ${nombre}.json`, content: Buffer.from(contenido).toString('base64'), branch: RAMA, ...(actual.falta ? {} : { sha: actual.sha }) })
    });
    if (!put.ok) throw new Error(`No se pudo guardar ${nombre}.json (GitHub ${put.status})`);
    escritos.push(nombre);
  }
  return resp(200, { ok: true, escritos });
}

// ---------- Informes guardados ----------
const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const codigoOk = c => /^INF-\d{4}-\d{3,}$/.test(String(c));
const fechaOk = f => /^\d{4}-\d{2}-\d{2}$/.test(f) && !isNaN(Date.parse(f + 'T00:00:00Z'));

async function escribir(nombre, datos, sha, mensaje) {
  return fetch(urlArchivo(nombre), {
    method: 'PUT', headers: { ...cab(true), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: mensaje, content: Buffer.from(JSON.stringify(datos, null, 4) + '\n').toString('base64'), branch: RAMA, ...(sha ? { sha } : {}) })
  });
}

function validarInforme(i) {
  if (!esObjeto(i)) return 'Informe inválido';
  if (typeof i.nombre !== 'string' || !i.nombre.trim() || i.nombre.trim().length > 80) return 'El nombre del informe es obligatorio (hasta 80 caracteres)';
  if (typeof i.fecha_evaluacion !== 'string' || !fechaOk(i.fecha_evaluacion)) return 'La fecha de evaluación no es válida';
  if (!Number.isInteger(i.postulantes) || i.postulantes < 1 || i.postulantes > 10) return 'La cantidad de postulantes debe ser de 1 a 10';
  if (!esObjeto(i.area) || typeof i.area.sigla !== 'string' || typeof i.area.nombre !== 'string') return 'Falta el área del informe';
  if (!esObjeto(i.cargo) || typeof i.cargo.codigo !== 'string' || typeof i.cargo.nombre !== 'string' || !Array.isArray(i.cargo.competencias)) return 'Falta el cargo del informe';
  if (!Array.isArray(i.dinamicas) || !i.dinamicas.length || i.dinamicas.length > 30 || i.dinamicas.some(d => !esObjeto(d) || typeof d.id !== 'string' || typeof d.titulo !== 'string')) return 'Las dinámicas del informe no son válidas';
  if (i.tiempo_total !== null && !(Number.isFinite(i.tiempo_total) && i.tiempo_total >= 0 && i.tiempo_total <= 999)) return 'El tiempo total no es válido';
  if (typeof i.guia !== 'boolean') return 'Falta indicar si el informe lleva guía y corrector';
  if (JSON.stringify(i).length > 300000) return 'El informe es demasiado grande';
  return null;
}

async function listarInformes() {
  const a = await leerArchivo(INDICE, Boolean(process.env.GITHUB_TOKEN_PRUEBAS_LLAMADOS_BD));
  return resp(200, a.falta || !Array.isArray(a.datos) ? [] : a.datos);
}

async function leerInforme(codigo) {
  if (!codigoOk(codigo)) return resp(400, { error: 'Código de informe inválido' });
  const a = await leerArchivo('informes/' + codigo, Boolean(process.env.GITHUB_TOKEN_PRUEBAS_LLAMADOS_BD));
  if (a.falta) return resp(404, { error: `No existe el informe ${codigo}` });
  return resp(200, a.datos);
}

// El nombre identifica al informe: mismo nombre = mismo informe (conserva el código); otro nombre = informe nuevo.
async function guardarInforme(inf, reemplazar) {
  inf.nombre = inf.nombre.trim();
  for (let intento = 0; intento < 6; intento++) {
    const idx = await leerArchivo(INDICE, true);
    const lista = idx.falta ? [] : idx.datos;
    if (!Array.isArray(lista)) throw new Error('informes.json tiene un formato inválido');
    const existente = lista.find(x => norm(x.nombre) === norm(inf.nombre));
    if (existente && !reemplazar) return resp(409, { error: 'nombre_existe', codigo: existente.codigo, nombre: existente.nombre, mensaje: `Ya existe el informe "${existente.nombre}" (${existente.codigo}).` });
    const ahora = new Date().toISOString();
    const prefijo = `INF-${ahora.slice(0, 4)}-`;
    const mayor = Math.max(0, ...lista.filter(x => String(x.codigo).startsWith(prefijo)).map(x => parseInt(String(x.codigo).slice(prefijo.length), 10) || 0));
    const codigo = existente ? existente.codigo : prefijo + String(mayor + 1).padStart(3, '0');
    const creado = existente ? existente.creado : ahora;
    const registro = { ...inf, codigo, creado, actualizado: ahora };
    const entrada = { codigo, nombre: inf.nombre, fecha_evaluacion: inf.fecha_evaluacion, creado, actualizado: ahora, area: inf.area.sigla, area_nombre: inf.area.nombre, cargo: inf.cargo.codigo, cargo_nombre: inf.cargo.nombre, dinamicas: inf.dinamicas.map(d => d.id), postulantes: inf.postulantes };
    const previo = await leerArchivo('informes/' + codigo, true);
    const p1 = await escribir('informes/' + codigo, registro, previo.falta ? null : previo.sha, `pruebas_llamados: informe ${codigo}`);
    if (!p1.ok) {
      // 409/422: otro guardado simultáneo ocupó ese código. Se espera un instante y se vuelve a calcular.
      if ([409, 422].includes(p1.status) && intento < 5) { await new Promise(r => setTimeout(r, 120 * (intento + 1))); continue; }
      throw new Error(`No se pudo guardar el informe ${codigo} (GitHub ${p1.status})`);
    }
    const nueva = existente ? lista.map(x => x.codigo === codigo ? entrada : x) : [...lista, entrada];
    const p2 = await escribir(INDICE, nueva, idx.falta ? null : idx.sha, `pruebas_llamados: índice de informes (${codigo})`);
    if (p2.ok) return resp(200, { ok: true, codigo, actualizado: Boolean(existente) });
    if (![409, 422].includes(p2.status)) throw new Error(`No se pudo actualizar informes.json (GitHub ${p2.status})`);
    await new Promise(r => setTimeout(r, 120 * (intento + 1)));
  }
  throw new Error('No se pudo guardar: otro guardado simultáneo ocupó el índice. Intente de nuevo.');
}

exports.handler = async (ev) => {
  try {
    if (!process.env.CLAVE_PRUEBAS) return resp(500, { error: 'Falta la variable CLAVE_PRUEBAS en Netlify' });
    if (ev.httpMethod === 'GET') {
      if (!claveOk((ev.headers || {})['x-clave'])) return resp(401, { error: 'Clave inválida' });
      const q = ev.queryStringParameters || {};
      if (q.informes) return await listarInformes();
      if (q.informe) return await leerInforme(q.informe);
      return await leerTodo();
    }
    if (ev.httpMethod !== 'POST') return resp(405, { error: 'Método no permitido' });
    if (!process.env.GITHUB_TOKEN_PRUEBAS_LLAMADOS_BD) return resp(500, { error: 'Falta la variable GITHUB_TOKEN_PRUEBAS_LLAMADOS_BD en Netlify; es necesaria para guardar datos' });

    const cuerpo = JSON.parse(ev.body || '{}');
    if (!claveOk(cuerpo.clave)) return resp(401, { error: 'Clave inválida' });
    if (cuerpo.accion === 'guardar_informe') {
      const error = validarInforme(cuerpo.informe);
      if (error) return resp(400, { error });
      return await guardarInforme(cuerpo.informe, Boolean(cuerpo.reemplazar));
    }
    if (!baseValida(cuerpo.base)) return resp(400, { error: 'Datos inválidos' });
    return await guardarTodo(cuerpo.base);
  } catch (e) {
    return resp(500, { error: e.message || 'Error del servidor' });
  }
};
