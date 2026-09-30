// Utilidades compartidas por index.html y admin.html

// Escapa texto para insertarlo de forma segura dentro de innerHTML o de atributos HTML.
function esc(valor) {
    const mapa = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(valor ?? '').replace(/[&<>"']/g, (c) => mapa[c]);
}
