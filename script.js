let baseDatosCargos = {};

// Cargar el archivo JSON al iniciar
async function cargarDatos() {
    try {
        const response = await fetch('datos.json');
        const data = await response.json();
        baseDatosCargos = data.cargos;
        inicializarSelectCargos();
    } catch (error) {
        console.error("Error al cargar el archivo JSON:", error);
        alert("Error de conexión. Asegúrate de estar corriendo la app en Netlify o un servidor local (como Live Server en VS Code).");
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
        opt.textContent = din.titulo;
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

    // Actualizar encabezados
    document.getElementById('cargoTitulo').textContent = `Cargo Objetivo: ${datosCargo.nombre}`;

    // Textos seguros con validación por si falta alguna propiedad
    const materialTexto = dinamicaSeleccionada.material_postulante || "Sin material específico definido.";
    const casoTexto = dinamicaSeleccionada.caso_o_consigna || "Sin caso específico definido.";
    const guiaTexto = dinamicaSeleccionada.guia_evaluacion || "Sin guía específica.";

    // Descripción de la dinámica enriquecida con material, objetivo y guía
    document.getElementById('dinamicaDescripcion').innerHTML = `
        <p><strong>Dinámica:</strong> ${dinamicaSeleccionada.titulo}</p>
        <p class="dynamics-list"><strong>Descripción:</strong> ${dinamicaSeleccionada.desc}</p>
        <div style="background: #eef7fa; border-left: 3px solid #2980b9; padding: 10px; margin-top: 8px; font-size: 13px;">
            <strong>📄 Material / Consigna para el Postulante:</strong><br>
            ${materialTexto}
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

    // Construir filas de competencias con celda libre para anotaciones a mano
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

    // Contenedor de postulantes (genera un bloque independiente por cada uno)
    let contenedorPost = document.getElementById('contenedorPostulantes');
    contenedorPost.innerHTML = '';

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
    }
}

// Iniciar la aplicación al cargar la página
window.onload = cargarDatos;