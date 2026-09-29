let baseDatosCargos = {};

async function cargarDatos() {
    try {
        const response = await fetch('datos.json');
        const data = await response.json();
        baseDatosCargos = data.cargos;
        inicializarSelectCargos();
    } catch (error) {
        console.error("Error al cargar el archivo JSON:", error);
        alert("Error de conexión. Asegúrate de correr la app en Netlify o un servidor local.");
    }
}

function inicializarSelectCargos() {
    const selectCargo = document.getElementById('cargoSelect');
    selectCargo.innerHTML = '';

    for (const key in baseDatosCargos) {
        let opt = document.createElement('option');
        opt.value = key;
        opt.textContent = baseDatosCargos[key].nombre;
        selectCargo.appendChild(opt);
    }

    actualizarDinamicas();
    generarEvaluacion();
}

function actualizarDinamicas() {
    const cargoKey = document.getElementById('cargoSelect').value;
    const selectDinamica = document.getElementById('tipoDinamica');
    selectDinamica.innerHTML = '';

    if (!baseDatosCargos[cargoKey]) return;

    const datos = baseDatosCargos[cargoKey];
    datos.dinamicas.forEach((din, index) => {
        let opt = document.createElement('option');
        opt.value = index;
        opt.textContent = `[${din.codigo}] ${din.titulo}`; // Muestra el código en el selector desplegable
        selectDinamica.appendChild(opt);
    });
}

function generarEvaluacion() {
    const cargoKey = document.getElementById('cargoSelect').value;
    const dinamicaIndex = document.getElementById('tipoDinamica').value;
    const numPostulantes = parseInt(document.getElementById('numPostulantes').value) || 1;
    
    if (!baseDatosCargos[cargoKey]) return;

    const datosCargo = baseDatosCargos[cargoKey];
    const dinamicaSeleccionada = datosCargo.dinamicas[dinamicaIndex];

    if (!dinamicaSeleccionada) return;

    document.getElementById('cargoTitulo').textContent = `Cargo Objetivo: ${datosCargo.nombre}`;

    // Textos seguros
    const codigoDin = dinamicaSeleccionada.codigo || "S/C";
    const tituloDin = dinamicaSeleccionada.titulo || "Sin título";
    const materialTexto = dinamicaSeleccionada.hoja_postulante || "Sin material específico definido.";
    const casoTexto = dinamicaSeleccionada.caso_o_consigna || "Sin objetivo específico.";
    const guiaTexto = dinamicaSeleccionada.guia_evaluacion || "Sin guía específica.";
    const tiempoTexto = dinamicaSeleccionada.tiempo_limite || "Sin límite especificado";

    // 1. Informe para el evaluador: Muestra Nombre y Código de la dinámica
    document.getElementById('dinamicaDescripcion').innerHTML = `
        <p><strong>Dinámica:</strong> ${tituloDin} <span style="background: #eaeded; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #2c3e50;">Código: ${codigoDin}</span></p>
        <p class="dynamics-list"><strong>Descripción:</strong> ${dinamicaSeleccionada.desc}</p>
        <div style="background: #f4ecf7; border-left: 3px solid #8e44ad; padding: 10px; margin-top: 8px; font-size: 13px;">
            <strong>⏱️ Tiempo Límite de la Prueba:</strong> <span style="font-size: 14px; font-weight: bold; color: #6c3483;">${tiempoTexto}</span>
        </div>
        <div style="background: #f9f9f9; border-left: 3px solid #e67e22; padding: 10px; margin-top: 8px; font-size: 13px;">
            <strong>🎯 Objetivo de la Prueba:</strong><br>
            ${casoTexto}
        </div>
        <div style="background: #fdfefe; border-left: 3px solid #27ae60; padding: 10px; margin-top: 8px; font-size: 12px; color: #333;">
            <strong>🔍 Guía de Observación para el Evaluador:</strong><br>
            ${guiaTexto.replace(/\n/g, '<br>')}
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
        // Bloque de calificación para el informe del evaluador
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

        // 2. Hoja de trabajo del postulante: Cabecera optimizada en dos renglones
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
                            <strong>Dinámica ID:</strong> <span style="font-family: monospace; font-weight: bold; background: #eaeded; padding: 2px 6px; border-radius: 3px;">${codigoDin}</span>
                        </div>
                        <div>
                            <span style="color: #8e44ad; font-weight: bold;">⏱️ Tiempo Límite: ${tiempoTexto}</span>
                        </div>
                    </div>
                </div>
                <div style="background: #ffffff; border: 1px solid var(--border); padding: 25px; border-radius: 6px; margin-top: 10px; font-size: 15px; line-height: 1.7; white-space: pre-line; min-height: 350px;">
                    ${materialTexto}
                </div>
            </div>
        `;
    }
}

window.onload = cargarDatos;