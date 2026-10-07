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
        <div class="bloque-dinamica" style="margin-bottom: 0.875rem;">
        <p><strong>Dinámica ${idx + 1}:</strong> ${din.titulo} <span style="background: #eaeded; padding: 2px 0.375rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.8125rem; color: #2c3e50;">ID: ${din.id}</span></p>
        <p class="dynamics-list"><strong>Descripción:</strong> ${din.desc}</p>
        <div style="background: #f4ecf7; border-left: 0.1875rem solid #8e44ad; padding: 0.625rem; margin-top: 0.5rem; font-size: 0.8125rem;">
            <strong>⏱️ Tiempo Límite:</strong> <span style="font-size: 0.875rem; font-weight: bold; color: #6c3483;">${din.tiempo_limite || 'Sin límite especificado'}</span>
        </div>
        <div style="background: #f9f9f9; border-left: 0.1875rem solid #e67e22; padding: 0.625rem; margin-top: 0.5rem; font-size: 0.8125rem;">
            <strong>🎯 Objetivo de la Prueba:</strong><br>
            ${din.caso_o_consigna || 'Sin objetivo específico.'}
        </div>
        <div class="bloque-guia" style="background: #fdfefe; border-left: 0.1875rem solid #27ae60; padding: 0.625rem; margin-top: 0.5rem; font-size: 0.75rem; color: #333;">
            <strong>🔍 Guía de Observación para el Evaluador:</strong><br>
            ${(din.guia_evaluacion || 'Sin guía específica.').replace(/\n/g, '<br>')}
        </div>
        <div class="bloque-guia" style="background: #eafaf1; border: 1px dashed #1e8449; border-left: 0.1875rem solid #1e8449; padding: 0.625rem; margin-top: 0.5rem; font-size: 0.75rem; color: #333;">
            <strong>✅ Corrector: Respuestas Correctas / Esperadas:</strong><br>
            ${(din.respuesta_esperada || 'Sin respuesta esperada definida.').replace(/\n/g, '<br>')}
        </div>
        </div>`).join('');

    const tiempoTotalHTML = seleccionadas.length > 1 ? `
        <div style="background: #f4ecf7; border: 1px solid #8e44ad; padding: 0.625rem; font-size: 0.875rem; font-weight: bold; color: #6c3483;">
            ⏱️ Tiempo total estimado (${seleccionadas.length} dinámicas): ${tiempoTotal} minutos
        </div>` : '';

    document.getElementById('dinamicaDescripcion').innerHTML = `
        ${bloquesDinamicas}
        ${tiempoTotalHTML}
    `;

    const comps = datosCargo.competencias;
    const codigoCompetencia = (c, idx) => c.codigo || `C${String(idx + 1).padStart(2, '0')}`;
    const competenciasPorDinamica = seleccionadas.map(din => {
        const referencias = [...String(din.caso_o_consigna || '').matchAll(/\b\d+\.\d+\b/g)].map(([codigo]) => codigo);
        return new Set(comps
            .map((comp, idx) => codigoCompetencia(comp, idx))
            .filter(codigo => referencias.length === 0 || referencias.includes(codigo)));
    });
    const maximosPorDinamica = competenciasPorDinamica.map(aplicables => aplicables.size * 5);
    const maximosPorCompetencia = comps.map((comp, compIdx) =>
        competenciasPorDinamica.filter(aplicables => aplicables.has(codigoCompetencia(comp, compIdx))).length * 5);
    const maxTotal = maximosPorDinamica.reduce((total, maximo) => total + maximo, 0);
    const PUNTAJE_FINAL_MAX = 30; // el psicotécnico siempre se reporta sobre 30, sin importar cuántas dinámicas se usen
    const pesos = seleccionadas.map(d => Number(d.peso) > 0 ? Number(d.peso) : 1);
    const pesosAplicables = pesos.filter((_, idx) => maximosPorDinamica[idx] > 0);
    const sumaPesos = pesosAplicables.reduce((a, b) => a + b, 0);
    const pesosIguales = pesosAplicables.length > 0 && pesosAplicables.every(p => p === pesosAplicables[0]);
    const formulaFinal = maxTotal === 0
        ? 'Sin competencias aplicables'
        : pesosIguales
        ? `Total ÷ ${maxTotal} × ${PUNTAJE_FINAL_MAX}`
        : `Σ (Sub total ÷ máximo aplicable × peso) ÷ ${sumaPesos} × ${PUNTAJE_FINAL_MAX}`;

    // Una sola tabla: cada dinámica es una fila y cada competencia una columna de puntaje.
    const leyendaHTML = `
        <div class="leyenda-dinamicas bloque-dinamica">
            <strong>Competencias a observar</strong>
            <ul>${comps.map((c, idx) => `
                <li><strong>${codigoCompetencia(c, idx)} - ${c.comp}:</strong> ${c.desc}</li>`).join('')}
            </ul>
        </div>`;

    const encabezadosHTML = comps.map((c, idx) => `<th class="col-puntaje" aria-label="${c.comp}" title="${c.comp}">${codigoCompetencia(c, idx)}</th>`).join('');

    const filasDinamicasHTML = seleccionadas.map((din, idx) => {
        const celdas = comps.map((comp, compIdx) => competenciasPorDinamica[idx].has(codigoCompetencia(comp, compIdx))
            ? `<td class="celda-puntaje"><span class="max">/ 5</span></td>`
            : '<td class="celda-no-aplica" aria-label="No aplica"></td>').join('');
        const maximo = maximosPorDinamica[idx];
        return `
        <tr>
            <td class="celda-comp">
                <strong><span class="badge-d">D${idx + 1}</span>${din.titulo}</strong>
                <span><span class="chip chip-id">${din.id}</span> <span class="chip chip-tiempo">⏱️ ${din.tiempo_limite || 'sin límite'}</span>${pesosIguales ? '' : ` <span class="chip chip-id">Peso ${pesos[idx]}</span>`}</span>
            </td>
            ${celdas}
            <td class="celda-puntaje col-subtotal"><span class="max">${maximo ? `/ ${maximo}` : 'No aplica'}</span></td>
        </tr>`;
    }).join('');

    const totalesCompetenciaHTML = maximosPorCompetencia.map(maximo => maximo
        ? `<td class="celda-puntaje"><span class="max">/ ${maximo}</span></td>`
        : '<td class="celda-no-aplica" aria-label="No aplica"></td>').join('');

    const tablaPuntajeHTML = `
        <table class="tabla-puntaje">
            <thead>
                <tr><th>Dinámica</th>${encabezadosHTML}<th class="col-subtotal">Sub total</th></tr>
            </thead>
            <tbody>
                ${filasDinamicasHTML}
                <tr class="fila-total">
                    <td>TOTAL</td>${totalesCompetenciaHTML}
                    <td class="celda-puntaje"><span class="max">/ ${maxTotal}</span></td>
                </tr>
                <tr class="fila-total">
                    <td>PUNTAJE FINAL</td>
                    <td colspan="${comps.length + 1}" class="celda-puntaje celda-formula"><span class="max">${formulaFinal}${maxTotal ? ` = ______ / ${PUNTAJE_FINAL_MAX}` : ''}</span></td>
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
                <div style="font-size:0.75rem; font-weight:600; color:var(--secondary); margin-top:0.5rem;">Observaciones y notas de conducta del postulante:</div>
                <div class="observations-box"></div>
            </div>
        `;

        seleccionadas.forEach(din => {
        contenedorHojasPostulantes.innerHTML += `
            <div class="candidate-sheet">
                <h3 style="color: var(--primary); margin-top: 0; border-bottom: 2px solid var(--primary); padding-bottom: 0.3125rem;">HOJA DE TRABAJO / CONSIGNA</h3>
                <div style="margin-bottom: 0.9375rem; font-size: 0.875rem; background: #fdfefe; border: 1px solid var(--border); padding: 0.75rem; border-radius: 0.25rem; line-height: 1.8;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex-grow: 1; margin-right: 1.25rem;">
                            <strong>Nombre del Postulante:</strong> __________________________________________________
                        </div>
                        <div>
                            <strong>Fecha:</strong> ____/____/20___
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; border-top: 1px dashed var(--border); pt: 0.5rem;">
                        <div>
                            <strong>Dinámica ID:</strong> <span style="font-family: monospace; font-weight: bold; background: #eaeded; padding: 2px 0.375rem; border-radius: 0.1875rem;">${din.id}</span>
                        </div>
                        <div>
                            <span style="color: #8e44ad; font-weight: bold;">⏱️ Tiempo Límite: ${din.tiempo_limite || 'Sin límite especificado'}</span>
                        </div>
                    </div>
                </div>
                <div class="area-respuesta-postulante ${cantidadRenglonesDinamica(din) === 0 ? 'area-respuesta-libre' : ''}">
                    ${prepararHojaDinamica(din) || "Sin material específico definido."}
                </div>
            </div>
        `;
        });
    }
}

window.onload = cargarDatos;