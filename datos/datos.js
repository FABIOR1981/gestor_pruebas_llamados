// Única capa de acceso a datos: todas las lecturas y escrituras pasan por Netlify.
const Datos = (() => {
    const API = '/.netlify/functions/pruebas';
    const ARCHIVOS = { areas: 'areas.json', cargos: 'cargos.json', dinamicas: 'dinamicas.json' };
    let origen = 'bd';

    async function cargar() {
        const r = await fetch(API, { cache: 'no-store' });
        const base = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(base.error || 'No se pudieron cargar los datos desde bd/pruebas_llamados.');
        if (!base.areas || !base.cargos || !Array.isArray(base.dinamicas)) {
            throw new Error('La respuesta de bd/pruebas_llamados tiene un formato inválido.');
        }
        origen = 'bd';
        return base;
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

    // ---- Informes guardados (informes.json + informes/<código>.json) ----
    async function pedir(url, opciones) {
        const r = await fetch(url, { cache: 'no-store', ...opciones });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
            const e = new Error(j.mensaje || j.error || 'Error ' + r.status);
            e.status = r.status;
            e.detalle = j;
            throw e;
        }
        return j;
    }
    const listarInformes = () => pedir(API + '?informes=1');
    const leerInforme = codigo => pedir(API + '?informe=' + encodeURIComponent(codigo));
    const guardarInforme = (informe, { clave = '', reemplazar = false } = {}) => pedir(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'guardar_informe', clave, reemplazar, informe })
    });

    return { cargar, guardar, listarInformes, leerInforme, guardarInforme, get origen() { return origen; } };
})();
