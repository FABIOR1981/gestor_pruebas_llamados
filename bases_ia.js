/* Módulo independiente: lee las bases (.docx) en el navegador, extrae directrices,
   las anonimiza y arma un prompt genérico para IA. El texto original nunca sale del equipo. */
(function () {
    const MAMMOTH_URL = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';

    const COMPETENCIAS = {
        'Atención al público': /atenci[oó]n (al|a) (p[uú]blico|cliente|usuario)|trato con (el )?p[uú]blico/i,
        'Trabajo en equipo': /trabajo en equipo|colaboraci[oó]n|cuadrilla/i,
        'Comunicación efectiva': /comunicaci[oó]n|redacci[oó]n|expresi[oó]n (oral|escrita)/i,
        'Atención al detalle': /atenci[oó]n al detalle|minuciosidad|prolijidad|control de (datos|calidad)/i,
        'Gestión del tiempo': /gesti[oó]n del tiempo|priorizaci[oó]n|planificaci[oó]n|organizaci[oó]n/i,
        'Resolución de problemas': /resoluci[oó]n de problemas|toma de decisiones|iniciativa/i,
        'Liderazgo': /liderazgo|supervisi[oó]n|conducci[oó]n de (equipos|personal)/i,
        'Normativa y seguridad': /normativa|seguridad (laboral|e higiene)|protocolos?/i,
        'Manejo de herramientas informáticas': /excel|word|planillas?|inform[aá]tic|sistemas? de gesti[oó]n/i,
        'Manejo de dinero / valores': /caja|arqueo|valores|cobranza|facturaci[oó]n/i,
        'Tolerancia a la presión': /presi[oó]n|estr[eé]s|alta demanda|urgencia/i,
        'Esfuerzo físico': /esfuerzo f[ií]sico|carga y descarga|levantar|manipulaci[oó]n de cargas/i
    };

    const SECCIONES = /^(perfil|funciones|tareas|requisitos|competencias|descripci[oó]n del cargo|cometidos|responsabilidades)/i;

    function anonimizar(texto, terminos) {
        let t = texto
            .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[EMAIL]')
            .replace(/\b\d{1}\.?\d{3}\.?\d{3}-?\d\b/g, '[DOC]')
            .replace(/\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/g, '[FECHA]')
            .replace(/(\$|U\$S|USD|UYU)\s?[\d.,]+/gi, '[MONTO]')
            .replace(/\b(llamado|concurso|licitaci[oó]n)\s*(n[°ºo.]*\s*)?[\w\/-]*\d[\w\/-]*/gi, '[LLAMADO]');
        terminos.forEach(w => {
            if (w.trim()) t = t.replace(new RegExp(w.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '[X]');
        });
        return t;
    }

    function extraerTareas(texto) {
        const lineas = texto.split(/\n+/).map(l => l.trim()).filter(Boolean);
        const tareas = [];
        let enSeccion = false;
        lineas.forEach(l => {
            if (SECCIONES.test(l) && l.length < 60) { enSeccion = /funciones|tareas|cometidos|responsabilidades/i.test(l); return; }
            if (enSeccion && l.length > 8 && l.length < 200) tareas.push(l.replace(/^[-•·*\d.)\s]+/, ''));
        });
        return tareas.slice(0, 12);
    }

    function cargosConocidos() {
        return typeof baseDatosGlobal !== 'undefined' ? baseDatosGlobal.cargos || {} : {};
    }

    function areasConocidas() {
        return typeof baseDatosGlobal !== 'undefined' ? baseDatosGlobal.areas || {} : {};
    }

    function detectarArea(texto) {
        const m = texto.match(/[\u00e1a]rea de\s+([^,.;\n]{3,50})/i);
        if (m) return m[1].trim();
        const hallada = Object.values(areasConocidas()).find(a => new RegExp('\\b' + a.nombre + '\\b', 'i').test(texto));
        return hallada ? hallada.nombre : '';
    }

    function existe(valor, catalogo) {
        const n = s => s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return Object.values(catalogo).some(o => n(o.nombre) === n(valor));
    }

    function similar(valor, catalogo) {
        const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const toks = s => norm(s).split(/[^a-z0-9]+/).filter(t => t.length > 2);
        const tv = toks(valor);
        const hit = Object.values(catalogo).find(o => {
            const to = toks(o.nombre);
            return to.length && (to.every(t => tv.includes(t)) || (tv.length && tv.every(t => to.includes(t))));
        });
        return hit ? hit.nombre : '';
    }

    function claveDe(nombre, catalogo) {
        const n = s => s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return Object.keys(catalogo).find(k => n(catalogo[k].nombre) === n(nombre)) || '';
    }

    function siglas(nombre) {
        const vacias = ['de', 'del', 'la', 'el', 'los', 'las', 'y', 'en', 'para'];
        const t = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .split(/[^a-z0-9]+/).filter(x => x && !vacias.includes(x));
        return ((t[0] || 'xxx') + 'xx').slice(0, 3).toUpperCase();
    }

    function generarIds(areaNombre, cargoNombre) {
        const areas = areasConocidas(), cargos = cargosConocidos();
        const dins = (typeof baseDatosGlobal !== 'undefined' && baseDatosGlobal.dinamicas) || [];
        const dos = n => String(n).padStart(2, '0');

        let areaId = claveDe(areaNombre, areas);
        const areaNueva = !areaId;
        if (areaNueva) {
            const base = siglas(areaNombre);
            areaId = base;
            for (let c = 65; areas[areaId] && c <= 90; c++) areaId = base.slice(0, 2) + String.fromCharCode(c);
        }

        let cargoId = claveDe(cargoNombre, cargos);
        const cargoNuevo = !cargoId;
        if (cargoNuevo) {
            const sig = siglas(cargoNombre);
            let n = 1;
            while (cargos[`CAR-${areaId}-${sig}-${dos(n)}`]) n++;
            cargoId = `CAR-${areaId}-${sig}-${dos(n)}`;
        }

        const prefijoDin = cargoId.replace(/^CAR-/, 'DIN-').replace(/-\d+$/, '');
        const usados = dins.filter(d => d.id.startsWith(prefijoDin + '-')).map(d => parseInt(d.id.split('-').pop(), 10) || 0);
        const inicio = (usados.length ? Math.max(...usados) : 0) + 1;
        const idsDin = [0, 1, 2, 3].map(i => `${prefijoDin}-${dos(inicio + i)}`);

        const areaNombreFinal = areaNueva ? areaNombre : areas[areaId].nombre;
        return { areaId, areaNueva, areaNombreFinal, cargoId, cargoNuevo, idsDin };
    }

    function detectarCargo(texto) {
        const m = texto.match(/cargo de\s+([^,.;\n]{3,80})/i) || texto.match(/llamado[^\n]*?[-–]\s*([^\n]{3,80})/i);
        if (m) return m[1].trim();
        const conocidos = cargosConocidos();
        const hallado = Object.values(conocidos).find(c => new RegExp('\\b' + c.nombre + '\\b', 'i').test(texto));
        return hallado ? hallado.nombre : '';
    }

    function cargarMammoth() {
        if (window.mammoth) return Promise.resolve();
        return new Promise((ok, err) => {
            const s = document.createElement('script');
            s.src = MAMMOTH_URL; s.onload = ok; s.onerror = () => err(new Error('No se pudo cargar el lector de .docx'));
            document.head.appendChild(s);
        });
    }

    function inyectarUI() {
        const css = document.createElement('style');
        css.textContent = `
        #bia-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;align-items:center;justify-content:center}
        #bia-modal.abierto{display:flex}
        #bia-box{background:#fff;width:min(46rem,94vw);max-height:90vh;overflow:auto;border-radius:.5rem;padding:1.25rem;box-sizing:border-box}
        #bia-box h2{margin:0 0 .5rem;font-size:1.2rem;color:var(--primary,#2c3e50)}
        #bia-box textarea,#bia-box input[type=text]{width:100%;box-sizing:border-box;padding:.5rem;border:1px solid #bdc3c7;border-radius:.25rem;font:inherit;font-size:.85rem}
        #bia-box textarea{min-height:5rem}
        #bia-box .bia-estado{font-size:.8rem;margin-top:.25rem}
        #bia-box .bia-estado.ok{color:#27ae60}
        #bia-box .bia-estado.falta{color:#c0392b;font-weight:600}
        #bia-box .bia-aviso{font-size:.8rem;color:#7f8c8d;margin:.25rem 0 .75rem}
        #bia-box .bia-paso{display:none;margin-top:.75rem}
        #bia-box .bia-chips label{display:inline-flex;gap:.3rem;align-items:center;margin:.15rem .5rem .15rem 0;font-weight:normal}
        #bia-box .bia-chips input{width:auto}
        #bia-box .bia-fila{display:flex;gap:.5rem;justify-content:flex-end;margin-top:.75rem}
        #bia-btn-abrir{background:#8e44ad}`;
        document.head.appendChild(css);

        const modal = document.createElement('div');
        modal.id = 'bia-modal';
        modal.innerHTML = `
        <div id="bia-box">
            <h2>Directrices desde las bases (local)</h2>
            <p class="bia-aviso">El archivo se lee en este navegador y no se envía a ningún servidor. Solo el resumen que usted revise irá en el prompt.</p>
            <input type="file" id="bia-file" accept=".docx">
            <div id="bia-error" style="color:#c0392b;font-size:.85rem"></div>

            <div class="bia-paso" id="bia-paso2">
                <label>Cargo del llamado (detectado en las bases; editable)</label>
                <input type="text" id="bia-cargo" list="bia-cargos-lista" placeholder="Ej: Jefe de Sucursal">
                <datalist id="bia-cargos-lista"></datalist>
                <div class="bia-estado" id="bia-estado-cargo"></div>
                <label style="margin-top:.6rem;display:block">Área (detectada en las bases; editable)</label>
                <input type="text" id="bia-area" list="bia-areas-lista" placeholder="Ej: Administración">
                <datalist id="bia-areas-lista"></datalist>
                <div class="bia-estado" id="bia-estado-area"></div>
                <label style="margin-top:.6rem;display:block">Términos a enmascarar (organismo, nombres, sectores; separados por coma)</label>
                <input type="text" id="bia-terminos" placeholder="Ej: Intendencia, Departamento X">
                <label style="margin-top:.6rem;display:block">Competencias detectadas</label>
                <div class="bia-chips" id="bia-comps"></div>
                <label style="margin-top:.6rem;display:block">Tareas típicas (editar / borrar lo sensible)</label>
                <textarea id="bia-tareas"></textarea>
                <div class="bia-fila"><button id="bia-gen">Generar prompt</button></div>
            </div>

            <div class="bia-paso" id="bia-paso3">
                <label>Prompt para la IA (sin datos de las bases)</label>
                <textarea id="bia-prompt" style="min-height:14rem"></textarea>
            </div>
            <div class="bia-fila">
                <button id="bia-copiar" style="display:none;background:#27ae60">Copiar</button>
                <button id="bia-cerrar" style="background:#7f8c8d">Cerrar</button>
            </div>
        </div>`;
        document.body.appendChild(modal);

        const btn = document.createElement('button');
        btn.id = 'bia-btn-abrir';
        btn.textContent = 'Directrices desde bases (IA)';
        const cont = document.querySelector('.no-print .btn-container') || document.querySelector('.no-print') || document.body;
        cont.appendChild(btn);

        const $ = id => document.getElementById(id);
        let textoBase = '';

        btn.onclick = () => modal.classList.add('abierto');

        const decidido = {};
        function estado(idInput, idMsg, catalogo, etiqueta, archivo) {
            const v = $(idInput).value.trim();
            const el = $(idMsg);
            el.className = 'bia-estado';
            el.textContent = '';
            if (!v) return;
            if (existe(v, catalogo)) {
                el.className = 'bia-estado ok';
                el.textContent = `${etiqueta} existente en ${archivo}.`;
                return;
            }
            const sim = similar(v, catalogo);
            if (sim && decidido[idInput] !== v) {
                el.className = 'bia-estado falta';
                el.append(`${etiqueta} "${v}" no existe en ${archivo}, pero hay uno similar: "${sim}". `);
                const usar = document.createElement('button');
                usar.textContent = 'Usar existente';
                usar.style.cssText = 'padding:.15rem .5rem;font-size:.75rem;margin-right:.3rem';
                usar.onclick = () => { $(idInput).value = sim; actualizarEstados(); };
                const crear = document.createElement('button');
                crear.textContent = 'Crear nuevo';
                crear.style.cssText = 'padding:.15rem .5rem;font-size:.75rem;background:#7f8c8d';
                crear.onclick = () => { decidido[idInput] = v; actualizarEstados(); };
                el.append(usar, crear);
                return;
            }
            el.className = 'bia-estado falta';
            el.textContent = `${etiqueta} "${v}" no existe en ${archivo}: debe crearse antes de cargar las din\u00e1micas.`;
        }
        function actualizarEstados() {
            estado('bia-cargo', 'bia-estado-cargo', cargosConocidos(), 'Cargo', 'cargos.json');
            estado('bia-area', 'bia-estado-area', areasConocidas(), '\u00c1rea', 'areas.json');
        }
        $('bia-cargo').oninput = $('bia-area').oninput = actualizarEstados;
        $('bia-cerrar').onclick = () => modal.classList.remove('abierto');

        $('bia-file').onchange = async e => {
            const f = e.target.files[0];
            $('bia-error').textContent = '';
            if (!f) return;
            try {
                await cargarMammoth();
                const r = await window.mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() });
                textoBase = r.value;
                $('bia-comps').innerHTML = Object.keys(COMPETENCIAS).map(k =>
                    `<label><input type="checkbox" value="${k}" ${COMPETENCIAS[k].test(textoBase) ? 'checked' : ''}>${k}</label>`).join('');
                $('bia-tareas').value = extraerTareas(textoBase).join('\n');
                $('bia-cargo').value = detectarCargo(textoBase);
                $('bia-area').value = detectarArea(textoBase);
                $('bia-areas-lista').innerHTML = Object.values(areasConocidas()).map(a => `<option value="${a.nombre}">`).join('');
                const lista = cargosConocidos();
                $('bia-cargos-lista').innerHTML = Object.values(lista).map(c => `<option value="${c.nombre}">`).join('');
                $('bia-paso2').style.display = 'block';
                actualizarEstados();
            } catch (ex) { $('bia-error').textContent = ex.message; }
        };

        $('bia-gen').onclick = () => {
            const terminos = $('bia-terminos').value.split(',');
            const comps = [...document.querySelectorAll('#bia-comps input:checked')].map(i => i.value);
            const tareas = anonimizar($('bia-tareas').value, terminos).split('\n').filter(l => l.trim());
            const cargo = anonimizar($('bia-cargo').value.trim(), terminos) || 'cargo genérico';
            const area = anonimizar($('bia-area').value.trim(), terminos);
            const ids = generarIds(area || 'General', cargo);
            const bloques = [];
            if (ids.areaNueva) {
                bloques.push(`1) AREAS.JSON (nueva entrada para pegar dentro del objeto):
"${ids.areaId}": { "nombre": "${ids.areaNombreFinal}" }`);
            }
            if (ids.cargoNuevo) {
                bloques.push(`${bloques.length + 1}) CARGOS.JSON (nueva entrada para pegar dentro del objeto):
"${ids.cargoId}": { "nombre": "${cargo}", "area": "${ids.areaNombreFinal}", "competencias": [ { "comp": "...", "desc": "..." } ] }
Completa 3 competencias a partir de la lista dada, cada una con su descripción breve.`);
            }
            bloques.push(`${bloques.length + 1}) DINAMICAS.JSON (elementos para agregar al arreglo):
Usa exactamente estos ids, en orden: ${ids.idsDin.join(', ')}. En todos, cargo_id = "${ids.cargoId}".`);
            const prompt =
`Actúa como psicólogo laboral. Diseña 4 dinámicas de evaluación para el cargo "${cargo}" (área: ${ids.areaNombreFinal}).

Competencias a evaluar:
${comps.map(c => '- ' + c).join('\n') || '- (sin definir)'}

Tareas típicas del puesto (genéricas):
${tareas.map(t => '- ' + t).join('\n') || '- (sin definir)'}

Devuelve cada bloque en un bloque de código JSON separado y rotulado, listo para pegar:
${bloques.join('\n\n')}

Campos de cada dinámica: id, cargo_id, titulo, desc, tiempo_limite, hoja_postulante, caso_o_consigna, guia_evaluacion, respuesta_esperada.
Requisitos: consignas escritas, resolubles en 2 a 8 minutos, sin nombres reales ni datos de organismos, con respuesta esperada verificable. No agregues texto fuera de los bloques.`;
            $('bia-prompt').value = prompt;
            $('bia-paso3').style.display = 'block';
            $('bia-copiar').style.display = 'inline-block';
        };

        $('bia-copiar').onclick = () => navigator.clipboard.writeText($('bia-prompt').value);
    }

    document.addEventListener('DOMContentLoaded', inyectarUI);
})();
