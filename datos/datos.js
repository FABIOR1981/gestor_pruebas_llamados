// Única capa de acceso a datos: para cambiar la fuente (API, BD) solo se modifica este archivo.
const Datos = (() => {
    const BASE = 'datos/';
    const ARCHIVOS = { areas: 'areas.json', cargos: 'cargos.json', dinamicas: 'dinamicas.json' };

    async function leer(archivo) {
        const response = await fetch(BASE + archivo);
        if (!response.ok) throw new Error(`No se pudo cargar ${archivo}`);
        return response.json();
    }

    async function cargar() {
        const [areas, cargos, dinamicas] = await Promise.all([
            leer(ARCHIVOS.areas), leer(ARCHIVOS.cargos), leer(ARCHIVOS.dinamicas)
        ]);
        return { areas, cargos, dinamicas };
    }

    // Exporta cada colección como archivo descargable.
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

    return { cargar, exportar };
})();
