// Única capa de acceso a datos: todas las lecturas y escrituras pasan por Netlify.
// La contraseña se pide al abrir la app, se guarda solo en esta pestaña (sessionStorage) y viaja en el encabezado X-Clave.
const Datos = (() => {
    const API = '/.netlify/functions/pruebas';
    let origen = 'bd';

    // ---- Contraseña ----
    let clave = '';
    try { clave = sessionStorage.getItem('pruebas_clave') || ''; } catch (e) { /* sin sessionStorage */ }
    const recordar = c => {
        clave = c || '';
        try { clave ? sessionStorage.setItem('pruebas_clave', clave) : sessionStorage.removeItem('pruebas_clave'); } catch (e) { /* sin sessionStorage */ }
    };

    // Diálogo con el mismo estilo de los demás modales de la app (clases mh / mb / campo / mf).
    function pedirClave(aviso) {
        return new Promise(resolver => {
            const d = document.createElement('dialog');
            d.style.width = 'min(420px, calc(100vw - 24px))';
            d.innerHTML = '<form>'
                + '<div class="mh"><h2>Contraseña</h2></div>'
                + '<div class="mb"><p class="sub" data-a></p>'
                + '<label class="campo">Contraseña<input type="password" autocomplete="current-password" required></label></div>'
                + '<div class="mf"><button type="button" class="btn sec" data-c>Cancelar</button><button class="btn">Entrar</button></div>'
                + '</form>';
            d.querySelector('[data-a]').textContent = aviso || 'Para usar la aplicación hace falta la contraseña.';
            const inp = d.querySelector('input');
            let valor = null;
            d.querySelector('form').addEventListener('submit', e => { e.preventDefault(); valor = inp.value; d.close(); });
            d.querySelector('[data-c]').onclick = () => d.close();
            d.addEventListener('close', () => { d.remove(); resolver(valor); });
            document.body.appendChild(d);
            d.showModal();
            inp.focus();
        });
    }
    let pendiente = null; // evita abrir dos diálogos si hay pedidos simultáneos
    const obtenerClave = aviso => pendiente || (pendiente = pedirClave(aviso).finally(() => { pendiente = null; }));

    // ---- Pedido genérico con reintento de contraseña ----
    async function pedir(url, { metodo = 'GET', cuerpo = null } = {}) {
        let reintento = false;
        // Sin contraseña guardada: se pide antes de llamar, así no aparece un error 401 en la consola.
        if (!clave && !(cuerpo && cuerpo.clave)) {
            const primera = await obtenerClave('');
            if (primera === null) {
                const e = new Error('Se necesita la contraseña.');
                e.status = 401;
                throw e;
            }
            recordar(primera);
        }
        for (;;) {
            const usada = cuerpo && cuerpo.clave && !reintento ? cuerpo.clave : clave;
            const opciones = { method: metodo, cache: 'no-store', headers: { 'X-Clave': usada } };
            if (cuerpo) {
                opciones.headers['Content-Type'] = 'application/json';
                opciones.body = JSON.stringify({ ...cuerpo, clave: usada });
            }
            const r = await fetch(url, opciones);
            const j = await r.json().catch(() => ({}));
            if (r.status === 401) {
                recordar('');
                const nueva = await obtenerClave(reintento || usada ? 'La contraseña no es correcta.' : '');
                if (nueva === null) {
                    const e = new Error('Se necesita la contraseña.');
                    e.status = 401;
                    e.detalle = j;
                    throw e;
                }
                recordar(nueva);
                reintento = true;
                continue;
            }
            if (!r.ok) {
                const e = new Error(j.mensaje || j.error || 'Error ' + r.status);
                e.status = r.status;
                e.detalle = j;
                throw e;
            }
            if (usada) recordar(usada);
            return j;
        }
    }

    async function cargar() {
        const base = await pedir(API);
        if (!base.areas || !base.cargos || !Array.isArray(base.dinamicas)) {
            throw new Error('La respuesta de bd/pruebas_llamados tiene un formato inválido.');
        }
        origen = 'bd';
        return base;
    }

    async function guardar(base, claveIngresada) {
        const j = await pedir(API, { metodo: 'POST', cuerpo: { clave: claveIngresada, base } });
        origen = 'bd';
        return j;
    }

    // ---- Informes guardados (informes.json + informes/<código>.json) ----
    const listarInformes = () => pedir(API + '?informes=1');
    const leerInforme = codigo => pedir(API + '?informe=' + encodeURIComponent(codigo));
    const guardarInforme = (informe, { clave: claveIngresada = '', reemplazar = false } = {}) => pedir(API, {
        metodo: 'POST',
        cuerpo: { accion: 'guardar_informe', clave: claveIngresada, reemplazar, informe }
    });

    return { cargar, guardar, listarInformes, leerInforme, guardarInforme, get origen() { return origen; } };
})();
