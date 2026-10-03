let baseDatosGlobal = { areas: {}, cargos: {}, dinamicas: [] };

async function cargarDatos() {
    try {
        baseDatosGlobal = await Datos.cargar();
        inicializarSelectCargos();
    } catch (error) {
        console.error("Error al cargar los datos:", error);
        alert("Error de conexión. Asegúrate de correr la app en Netlify o un servidor local.");
    }
}

function inicializarSelectCargos() {
    const selectCargo = document.getElementById('cargoSelect');
    selectCargo.innerHTML = '';

    for (const key in baseDatosGlobal.cargos) {
        let opt = document.createElement('option');
        opt.value = key;
        opt.textContent = `[${key}] ${baseDatosGlobal.cargos[key].nombre}`;
        selectCargo.appendChild(opt);
    }

    actualizarDinamicas();
}

function actualizarDinamicas() {
    const cargoKey = document.getElementById('cargoSelect').value; // Ej: CAR-SUP-ENC-01
    const contenedor = document.getElementById('tipoDinamica');
    contenedor.innerHTML = '';

    if (!baseDatosGlobal.cargos[cargoKey]) return;

    // Filtramos las dinámicas que coinciden exactamente con el cargo_id del JSON
    const dinamicasFiltradas = baseDatosGlobal.dinamicas.filter(din => din.cargo_id === cargoKey);

    if (dinamicasFiltradas.length === 0) {
        contenedor.innerHTML = '<span class="dinamicas-vacio">No hay dinámicas para este cargo</span>';
        limpiarResultados();
        return;
    }

    dinamicasFiltradas.forEach((din) => {
        const card = document.createElement('label');
        card.className = 'dinamica-card';

        const check = document.createElement('input');
        check.type = 'checkbox';
        check.value = din.id;
        check.onchange = () => {
            card.classList.toggle('seleccionada', check.checked);
            onDinamicaChange();
        };

        const info = document.createElement('div');
        const titulo = document.createElement('span');
        titulo.className = 'dinamica-titulo';
        titulo.textContent = din.titulo;

        const meta = document.createElement('div');
        meta.className = 'dinamica-meta';
        const chipId = document.createElement('span');
        chipId.className = 'chip chip-id';
        chipId.textContent = din.id;
        const chipTiempo = document.createElement('span');
        chipTiempo.className = 'chip chip-tiempo';
        chipTiempo.textContent = `⏱️ ${din.tiempo_limite || 'sin límite'}`;
        meta.append(chipId, chipTiempo);

        info.append(titulo, meta);
        card.append(check, info);
        contenedor.appendChild(card);
    });

    limpiarResultados();
}

// Minutos estimados a partir del texto del tiempo; ante rangos toma el mayor.
function minutosDe(din) {
    const numeros = (din.tiempo_limite || '').match(/\d+/g);
    return numeros ? Math.max(...numeros.map(Number)) : 0;
}

function obtenerDinamicasSeleccionadas() {
    const ids = Array.from(document.querySelectorAll('#tipoDinamica input:checked')).map(c => c.value);
    return baseDatosGlobal.dinamicas.filter(din => ids.includes(din.id));
}

function actualizarTiempoTotal() {
    const seleccionadas = obtenerDinamicasSeleccionadas();
    const total = seleccionadas.reduce((suma, din) => suma + minutosDe(din), 0);
    document.getElementById('tiempoTotalSeleccion').textContent =
        seleccionadas.length > 1 ? `⏱️ Tiempo total estimado: ${total} min (${seleccionadas.length} dinámicas)` : '';
}

// Eventos de control al cambiar los selectores para evitar datos cruzados
function onCargoChange() {
    actualizarDinamicas();
    limpiarResultados();
}

function onDinamicaChange() {
    limpiarResultados();
}

// Muestra u oculta la guía de observación y el corrector, también al imprimir.
function toggleGuia() {
    const incluir = document.getElementById('incluirGuia').checked;
    document.getElementById('printArea').classList.toggle('ocultar-guia', !incluir);
}

// Función que blanquea la pantalla de resultados
function limpiarResultados() {
    actualizarTiempoTotal();
    document.getElementById('cargoTitulo').textContent = "Cargo: -";
    document.getElementById('dinamicaDescripcion').innerHTML = '<p style="color: #7f8c8d; font-style: italic;">Selección modificada. Presione "Generar Formulario" para actualizar los datos.</p>';
    document.getElementById('contenedorPostulantes').innerHTML = '';
    document.getElementById('materialPostulanteContenido').innerHTML = '';
}

function generarEvaluacion() {
    const cargoKey = document.getElementById('cargoSelect').value;
    const numPostulantes = parseInt(document.getElementById('numPostulantes').value) || 1;
    
    if (!baseDatosGlobal.cargos[cargoKey]) return;

    const datosCargo = baseDatosGlobal.cargos[cargoKey];
    const seleccionadas = obtenerDinamicasSeleccionadas();

    if (seleccionadas.length === 0) {
        alert("Por favor seleccione al menos una dinámica.");
        return;
    }

    document.getElementById('cargoTitulo').textContent = `Cargo Objetivo: [${cargoKey}] ${datosCargo.nombre}`;

    const tiempoTotal = seleccionadas.reduce((suma, din) => suma + minutosDe(din), 0);

    // Informe para el evaluador
    const bloquesDinamicas = seleccionadas.map((din, idx) => `
        <div class="bloque-dinamica" style="margin-bottom: 14px;">
        <p><strong>Dinámica ${idx + 1}:</strong> ${din.titulo} <span style="background: #eaeded; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #2c3e50;">ID: ${din.id}</span></p>
        <p class="dynamics-list"><strong>Descripción:</strong> ${din.desc}</p>
        <div style="background: #f4ecf7; border-left: 3px solid #8e44ad; padding: 10px; margin-top: 8px; font-size: 13px;">
            <strong>⏱️ Tiempo Límite:</strong> <span style="font-size: 14px; font-weight: bold; color: #6c3483;">${din.tiempo_limite || 'Sin límite especificado'}</span>
        </div>
        <div style="background: #f9f9f9; border-left: 3px solid #e67e22; padding: 10px; margin-top: 8px; font-size: 13px;">
            <strong>🎯 Objetivo de la Prueba:</strong><br>
            ${din.caso_o_consigna || 'Sin objetivo específico.'}
        </div>
        <div class="bloque-guia" style="background: #fdfefe; border-left: 3px solid #27ae60; padding: 10px; margin-top: 8px; font-size: 12px; color: #333;">
            <strong>🔍 Guía de Observación para el Evaluador:</strong><br>
            ${(din.guia_evaluacion || 'Sin guía específica.').replace(/\n/g, '<br>')}
        </div>
        <div class="bloque-guia" style="background: #eafaf1; border: 1px dashed #1e8449; border-left: 3px solid #1e8449; padding: 10px; margin-top: 8px; font-size: 12px; color: #333;">
            <strong>✅ Corrector: Respuestas Correctas / Esperadas:</strong><br>
            ${(din.respuesta_esperada || 'Sin respuesta esperada definida.').replace(/\n/g, '<br>')}
        </div>
        </div>`).join('');

    const tiempoTotalHTML = seleccionadas.length > 1 ? `
        <div style="background: #f4ecf7; border: 1px solid #8e44ad; padding: 10px; font-size: 14px; font-weight: bold; color: #6c3483;">
            ⏱️ Tiempo total estimado (${seleccionadas.length} dinámicas): ${tiempoTotal} minutos
        </div>` : '';

    document.getElementById('dinamicaDescripcion').innerHTML = `
        ${bloquesDinamicas}
        ${tiempoTotalHTML}
    `;

    const comps = datosCargo.competencias;
    const maxPorDinamica = comps.length * 5;
    const maxPorCompetencia = seleccionadas.length * 5;
    const maxTotal = maxPorDinamica * seleccionadas.length;

    // Una sola tabla: cada dinámica es una fila y cada competencia una columna de puntaje.
    const leyendaHTML = `
        <div class="leyenda-dinamicas bloque-dinamica">
            <strong>Competencias a observar</strong>
            <ul>${comps.map(c => `
                <li><strong>${c.comp}:</strong> ${c.desc}</li>`).join('')}
            </ul>
        </div>`;

    const encabezadosHTML = comps.map(c => `<th class="col-puntaje">${c.comp}</th>`).join('');
    const celdasVaciasHTML = comps.map(() => `<td class="celda-puntaje"><span class="max">/ 5</span></td>`).join('');

    const filasDinamicasHTML = seleccionadas.map((din, idx) => `
        <tr>
            <td class="celda-comp">
                <strong><span class="badge-d">D${idx + 1}</span>${din.titulo}</strong>
                <span><span class="chip chip-id">${din.id}</span> <span class="chip chip-tiempo">⏱️ ${din.tiempo_limite || 'sin límite'}</span></span>
            </td>
            ${celdasVaciasHTML}
            <td class="celda-puntaje col-subtotal"><span class="max">/ ${maxPorDinamica}</span></td>
        </tr>`).join('');

    const totalesCompetenciaHTML = comps.map(() => `<td class="celda-puntaje"><span class="max">/ ${maxPorCompetencia}</span></td>`).join('');

    const tablaPuntajeHTML = `
        <table class="tabla-puntaje">
            <thead>
                <tr><th>Dinámica</th>${encabezadosHTML}<th class="col-subtotal">Total dinámica</th></tr>
            </thead>
            <tbody>
                ${filasDinamicasHTML}
                <tr class="fila-total">
                    <td>TOTAL</td>${totalesCompetenciaHTML}
                    <td class="celda-puntaje"><span class="max">/ ${maxTotal}</span></td>
                </tr>
            </tbody>
        </table>`;

    let contenedorPost = document.getElementById('contenedorPostulantes');
    contenedorPost.innerHTML = leyendaHTML;
    
    let contenedorHojasPostulantes = document.getElementById('materialPostulanteContenido');
    contenedorHojasPostulantes.innerHTML = '';

    for (let i = 1; i <= numPostulantes; i++) {
        contenedorPost.innerHTML += `
            <div class="candidate-box">
                <h4>Postulante #${i}: __________________________________________________</h4>
                ${tablaPuntajeHTML}
                <div style="font-size:12px; font-weight:600; color:var(--secondary); margin-top:8px;">Observaciones y notas de conducta del postulante:</div>
                <div class="observations-box"></div>
            </div>
        `;

        seleccionadas.forEach(din => {
        contenedorHojasPostulantes.innerHTML += `
            <div class="candidate-sheet">
                <h3 style="color: var(--primary); margin-top: 0; border-bottom: 2px solid var(--primary); padding-bottom: 5px;">HOJA DE TRABAJO / CONSIGNA</h3>
                <div style="margin-bottom: 15px; font-size: 14px; background: #fdfefe; border: 1px solid var(--border); padding: 12px; border-radius: 4px; line-height: 1.8;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex-grow: 1; margin-right: 20px;">
                            <strong>Nombre del Postulante:</strong> __________________________________________________
                        </div>
                        <div>
                            <strong>Fecha:</strong> ____/____/20___
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; border-top: 1px dashed var(--border); pt: 8px;">
                        <div>
                            <strong>Dinámica ID:</strong> <span style="font-family: monospace; font-weight: bold; background: #eaeded; padding: 2px 6px; border-radius: 3px;">${din.id}</span>
                        </div>
                        <div>
                            <span style="color: #8e44ad; font-weight: bold;">⏱️ Tiempo Límite: ${din.tiempo_limite || 'Sin límite especificado'}</span>
                        </div>
                    </div>
                </div>
                <div style="background: #ffffff; border: 1px solid var(--border); padding: 25px; border-radius: 6px; margin-top: 10px; font-size: 15px; line-height: 1.7; white-space: pre-line; min-height: 350px;">
                    ${din.hoja_postulante || "Sin material específico definido."}
                </div>
            </div>
        `;
        });
    }
}

window.onload = cargarDatos;