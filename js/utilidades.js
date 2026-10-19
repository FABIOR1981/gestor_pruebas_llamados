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

// ---- Esquema de puntaje de un informe ----
// Máximos por celda (dinámica × competencia), por dinámica, por competencia y total, más la fórmula del puntaje final.
const PUNTAJE_FINAL_MAX = 30;

function esquemaPuntaje(cargo, dinamicas) {
    const codigos = cargo.competencias.map(codigoCompetencia);
    const pm = dinamicas.map(puntajeMaximoDinamica);
    const aplicables = dinamicas.map(d => new Set(competenciasDeDinamica(d, cargo)));
    const maxD = aplicables.map((s, i) => s.size * pm[i]);
    const maxC = codigos.map(c => aplicables.reduce((a, s, i) => a + (s.has(c) ? pm[i] : 0), 0));
    const maxT = maxD.reduce((a, b) => a + b, 0);
    const pesos = dinamicas.map(d => Number(d.peso) > 0 ? Number(d.peso) : 1);
    const pA = pesos.filter((_, i) => maxD[i] > 0);
    const sumP = pA.reduce((a, b) => a + b, 0);
    const iguales = pA.length > 0 && pA.every(p => p === pA[0]);
    return { codigos, pm, aplicables, maxD, maxC, maxT, pesos, sumP, iguales };
}

// Puntaje de un postulante a partir de lo cargado en la corrección: puntajes[idDinamica][códigoCompetencia] = número.
// Subtotales, totales y puntaje final quedan en null mientras falte alguna celda de lo que suman.
function calcularPuntajes(cargo, dinamicas, puntajes) {
    const e = esquemaPuntaje(cargo, dinamicas), p = puntajes || {};
    const valor = (d, c) => { const v = p[d.id] && p[d.id][c]; return typeof v === 'number' && Number.isFinite(v) ? v : null; };
    let cargadas = 0, totalCeldas = 0;
    const sub = dinamicas.map((d, i) => {
        let suma = 0, falta = false;
        e.aplicables[i].forEach(c => { totalCeldas++; const v = valor(d, c); if (v === null) falta = true; else { cargadas++; suma += v; } });
        return e.maxD[i] && !falta ? suma : null;
    });
    const col = e.codigos.map(c => {
        let suma = 0, falta = false, aplica = false;
        dinamicas.forEach((d, i) => { if (e.aplicables[i].has(c)) { aplica = true; const v = valor(d, c); if (v === null) falta = true; else suma += v; } });
        return aplica && !falta ? suma : null;
    });
    const completo = totalCeldas > 0 && cargadas === totalCeldas;
    const total = completo ? sub.reduce((a, s) => a + (s || 0), 0) : null;
    let final = null;
    if (completo && e.maxT > 0) {
        final = e.iguales
            ? total / e.maxT * PUNTAJE_FINAL_MAX
            : sub.reduce((a, s, i) => a + (e.maxD[i] ? s / e.maxD[i] * e.pesos[i] : 0), 0) / e.sumP * PUNTAJE_FINAL_MAX;
    }
    return { esquema: e, valor, sub, col, total, final, cargadas, totalCeldas, completo };
}

// 12.5 → "12,5"; redondea a 2 decimales.
const fmtPuntaje = n => n === null || n === undefined ? '' : String(Math.round(n * 100) / 100).replace('.', ',');

const DICTAMENES = ['Apto', 'Apto con reservas', 'No apto'];

// Frases (HTML ya escapado) para avisar del control anterior. Lista vacía = todo relacionado.
function avisosRelaciones(cargo, dinamicas) {
    const { sinCompetencia, sinCubrir } = controlRelaciones(cargo, dinamicas), avisos = [];
    if (sinCompetencia.length) avisos.push(`Dinámicas sin competencia relacionada: <b>${sinCompetencia.map(d => `${esc(d.titulo)} (${esc(d.id.replace('DIN-', ''))})`).join(', ')}</b>.`);
    if (sinCubrir.length) avisos.push(`Competencias que ninguna dinámica evalúa: <b>${sinCubrir.map(c => `${esc(codigoCompetencia(c, cargo.competencias.indexOf(c)))} ${esc(c.comp)}`).join(', ')}</b>.`);
    return avisos;
}
