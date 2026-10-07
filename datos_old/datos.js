// Única capa de acceso a datos: para cambiar la fuente (API, BD) solo se modifica este archivo.
// Lee y guarda en bd/pruebas_llamados mediante la función de Netlify; si no está disponible, usa los JSON locales de datos/.
const Datos = (() => {
    const API = '/.netlify/functions/pruebas';
    const BASE = 'datos/';
    const ARCHIVOS = { areas: 'areas.json', cargos: 'cargos.json', dinamicas: 'dinamicas.json' };
    let origen = 'local';

    async function leer(archivo) {
        const response = await fetch(BASE + archivo);
        if (!response.ok) throw new Error(`No se pudo cargar ${archivo}`);
        return response.json();
    }

    async function cargar() {
        try {
            const r = await fetch(API, { cache: 'no-store' });
            if (r.ok) {
                origen = 'bd';
                return await r.json();
            }
        } catch (e) { /* sin función: se usan los archivos locales */ }
        origen = 'local';
        const [areas, cargos, dinamicas] = await Promise.all([
            leer(ARCHIVOS.areas), leer(ARCHIVOS.cargos), leer(ARCHIVOS.dinamicas)
        ]);
        return { areas, cargos, dinamicas };
    }

    async function guardar(base, clave) {
        const r = await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clave, base })
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'Error ' + r.status);
        origen = 'bd';
        return j;
    }

    // Copia de respaldo: descarga cada colección como archivo.
    function exportar(base) {
        Object.keys(ARCHIVOS).forEach(clave => {
            const contenido = encodeURIComponent(JSON.stringify(base[clave], null, 4));
            const a = document.createElement('a');
            a.href = 'data:text/json;charset=utf-8,' + contenido;
            a.download = ARCHIVOS[clave];
            document.body.appendChild(a);
            a.click();
            a.remove();
        });
    }

    return { cargar, guardar, exportar, get origen() { return origen; } };
})();
