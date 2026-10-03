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
        contenedor.innerHTML = '<em>No hay dinámicas para este cargo</em>';
        limpiarResultados();
        return;
    }

    dinamicasFiltradas.forEach((din) => {
        const label = document.createElement('label');
        label.style.cssText = 'display: block; font-weight: normal; margin-bottom: 4px; cursor: pointer;';
        const check = document.createElement('input');
        check.type = 'checkbox';
        check.value = din.id;
        check.style.cssText = 'width: auto; margin-right: 6px;';
        check.onchange = onDinamicaChange;
        label.appendChild(check);
        label.appendChild(document.createTextNode(`[${din.id}] ${din.titulo} (${din.tiempo_limite || 'sin límite'})`));
        contenedor.appendChild(label);
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
        seleccionadas.length ? `⏱️ Tiempo total estimado: ${total} min (${seleccionadas.length} dinámica/s)` : '';
}

// Eventos de control al cambiar los selectores para evitar datos cruzados
function onCargoChange() {
    actualizarDinamicas();
    limpiarResultados();
}

function onDinamicaChange() {
    limpiarResultados();
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
        <div style="margin-bottom: 14px;">
        <p><strong>Dinámica ${idx + 1}:</strong> ${din.titulo} <span style="background: #eaeded; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #2c3e50;">ID: ${din.id}</span></p>
        <p class="dynamics-list"><strong>Descripción:</strong> ${din.desc}</p>
        <div style="background: #f4ecf7; border-left: 3px solid #8e44ad; padding: 10px; margin-top: 8px; font-size: 13px;">
            <strong>⏱️ Tiempo Límite:</strong> <span style="font-size: 14px; font-weight: bold; color: #6c3483;">${din.tiempo_limite || 'Sin límite especificado'}</span>
        </div>
        <div style="background: #f9f9f9; border-left: 3px solid #e67e22; padding: 10px; margin-top: 8px; font-size: 13px;">
            <strong>🎯 Objetivo de la Prueba:</strong><br>
            ${din.caso_o_consigna || 'Sin objetivo específico.'}
        </div>
        <div style="background: #fdfefe; border-left: 3px solid #27ae60; padding: 10px; margin-top: 8px; font-size: 12px; color: #333;">
            <strong>🔍 Guía de Observación para el Evaluador:</strong><br>
            ${(din.guia_evaluacion || 'Sin guía específica.').replace(/\n/g, '<br>')}
        </div>
        </div>`).join('');

    document.getElementById('dinamicaDescripcion').innerHTML = `
        ${bloquesDinamicas}
        <div style="background: #f4ecf7; border: 1px solid #8e44ad; padding: 10px; font-size: 14px; font-weight: bold; color: #6c3483;">
            ⏱️ Tiempo total estimado (${seleccionadas.length} dinámica/s): ${tiempoTotal} minutos
        </div>
    `;

    let filasCompetenciasHTML = '';
    datosCargo.competencias.forEach(c => {
        filasCompetenciasHTML += `
            <tr>
                <td style="width: 35%;"><strong>${c.comp}</strong><br><span style="font-size:11px; color:#666;">${c.desc}</span></td>
                <td style="width: 45%;"></td>
                <td style="width: 20%; text-align: center;">[ &nbsp; &nbsp; ] / 5</td>
            </tr>
        `;
    });

    let contenedorPost = document.getElementById('contenedorPostulantes');
    contenedorPost.innerHTML = '';
    
    let contenedorHojasPostulantes = document.getElementById('materialPostulanteContenido');
    contenedorHojasPostulantes.innerHTML = '';

    for (let i = 1; i <= numPostulantes; i++) {
        contenedorPost.innerHTML += `
            <div class="candidate-box">
                <h4>Postulante #${i}: __________________________________________________</h4>
                <table class="metrics-table">
                    <thead>
                        <tr>
                            <th>Competencia / Indicador</th>
                            <th>Notas de Conducta</th>
                            <th>Puntuación (1-5)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filasCompetenciasHTML}
                    </tbody>
                </table>
                <div style="font-size:12px; font-weight:600; color:var(--secondary); margin-top:8px;">Observaciones específicas del postulante:</div>
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