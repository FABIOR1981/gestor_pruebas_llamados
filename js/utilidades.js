// Utilidades compartidas por index.html y admin.html
const RENGLONES_HOJA_GLOBAL = 5;
const REGEX_RENGLONES_FINALES = /(?:<div class=['"]renglon-respuesta['"]><\/div>)+\s*$/;

function separarRenglones(html) {
    const final = html.match(REGEX_RENGLONES_FINALES);
    const renglones = final ? (final[0].match(/<div/g) || []).length : 0;
    const texto = html.replace(REGEX_RENGLONES_FINALES, '').replace(/&nbsp;/g, '\u00a0').trim();
    return { texto, renglones };
}

function normalizarCantidadRenglones(valor) {
    const parsed = Number.parseInt(valor, 10);
    return Math.min(Math.max(Number.isNaN(parsed) ? RENGLONES_HOJA_GLOBAL : parsed, 0), 30);
}

function componerHoja(texto, renglones) {
    const cuerpo = texto.replace(/\u00a0/g, '&nbsp;').trim();
    const cantidad = normalizarCantidadRenglones(renglones);
    return cantidad > 0
        ? `${cuerpo}\n\n${"<div class='renglon-respuesta'></div>".repeat(cantidad)}`
        : cuerpo;
}

function cantidadRenglonesDinamica(dinamica) {
    const particular = dinamica.renglones_hoja;
    const cantidad = particular === undefined || particular === null || particular === ''
        ? RENGLONES_HOJA_GLOBAL
        : particular;
    return normalizarCantidadRenglones(cantidad);
}

function prepararHojaDinamica(dinamica) {
    const { texto } = separarRenglones(dinamica.hoja_postulante || '');
    return componerHoja(texto, cantidadRenglonesDinamica(dinamica));
}

// Escapa texto para insertarlo de forma segura dentro de innerHTML o de atributos HTML.
function esc(valor) {
    const mapa = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(valor ?? '').replace(/[&<>"']/g, (c) => mapa[c]);
}

// Muestra "JEFE DE SUCURSAL" como "Jefe de sucursal"; los nombres que ya tienen minúsculas se dejan como están.
function bonito(nombre) {
    const n = String(nombre ?? '');
    return n === n.toUpperCase() && n !== n.toLowerCase() ? n.charAt(0) + n.slice(1).toLowerCase() : n;
}

// ---- Puntaje máximo por competencia ----
// Valor general: cada competencia evaluada en una dinámica vale hasta 5 puntos.
// Una dinámica puede traer su propio "puntaje_maximo"; si no lo trae, vale el general.
const PUNTAJE_MAX_COMPETENCIA = 5;

function puntajeMaximoDinamica(dinamica) {
    const n = Number(dinamica && dinamica.puntaje_maximo);
    return Number.isFinite(n) && n > 0 ? n : PUNTAJE_MAX_COMPETENCIA;
}

// ---- Relación competencias ↔ dinámicas ----
// Cada competencia lleva un código propio dentro de su cargo (único dentro del cargo).
// Cada dinámica guarda en "competencias" los códigos que evalúa.
const codigoCompetencia = (c, i) => c.codigo || 'C' + String(i + 1).padStart(2, '0');

// Códigos escritos a mano en un texto ("Evalúa 6.1 y 6.3"): así se relacionaban antes de existir el campo "competencias".
const codigosCitados = texto => [...String(texto || '').matchAll(/\b\d+\.\d+\b/g)].map(m => m[0]);

// Códigos (en el orden del cargo) de las competencias que evalúa una dinámica.
function competenciasDeDinamica(dinamica, cargo) {
    const codigos = cargo.competencias.map(codigoCompetencia);
    if (Array.isArray(dinamica.competencias)) return codigos.filter(c => dinamica.competencias.includes(c));
    // Datos e informes guardados antes del campo "competencias": se leían del texto de la dinámica (sin códigos citados = todas).
    const citados = codigosCitados(dinamica.caso_o_consigna);
    return codigos.filter(c => !citados.length || citados.includes(c));
}

// Dinámicas sin ninguna competencia relacionada y competencias que ninguna de esas dinámicas evalúa.
function controlRelaciones(cargo, dinamicas) {
    const sinCompetencia = dinamicas.filter(d => competenciasDeDinamica(d, cargo).length === 0);
    const cubiertas = new Set(dinamicas.flatMap(d => competenciasDeDinamica(d, cargo)));
    const sinCubrir = cargo.competencias.filter((c, i) => !cubiertas.has(codigoCompetencia(c, i)));
    return { sinCompetencia, sinCubrir };
}

// Frases (HTML ya escapado) para avisar del control anterior. Lista vacía = todo relacionado.
function avisosRelaciones(cargo, dinamicas) {
    const { sinCompetencia, sinCubrir } = controlRelaciones(cargo, dinamicas), avisos = [];
    if (sinCompetencia.length) avisos.push(`Dinámicas sin competencia relacionada: <b>${sinCompetencia.map(d => `${esc(d.titulo)} (${esc(d.id.replace('DIN-', ''))})`).join(', ')}</b>.`);
    if (sinCubrir.length) avisos.push(`Competencias que ninguna dinámica evalúa: <b>${sinCubrir.map(c => `${esc(codigoCompetencia(c, cargo.competencias.indexOf(c)))} ${esc(c.comp)}`).join(', ')}</b>.`);
    return avisos;
}
