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
