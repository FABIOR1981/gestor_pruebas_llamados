let baseDatosCargos = {};

// Cargar datos (primero intenta del localStorage, si no hay, carga el JSON inicial)
async function cargarDatos() {
    try {
        const guardadoLocal = localStorage.getItem('psicotecnico_datos');
        if (guardadoLocal) {
            baseDatosCargos = JSON.parse(guardadoLocal);
            inicializarSelectCargos();
        } else {
            const response = await fetch('datos.json');
            const data = await response.json();
            baseDatosCargos = data.cargos;
            guardarEnLocal(); // Guardar copia inicial en localStorage
            inicializarSelectCargos();
        }
    } catch (error) {
        console.error("Error al cargar los datos:", error);
        alert("No se pudieron cargar los datos.");
    }
}

function guardarEnLocal() {
    localStorage.setItem('psicotecnico_datos', JSON.stringify(baseDatosCargos));
}

function inicializarSelectCargos() {
    const selectCargo = document.getElementById('cargoSelect');
    const selectCargoModal = document.getElementById('nuevoCargoSelect');
    
    selectCargo.innerHTML = '';
    if(selectCargoModal) selectCargoModal.innerHTML = '';

    for (const key in baseDatosCargos) {
        // Para el panel principal
        let opt = document.createElement('option');
        opt.value = key;
        opt.textContent = baseDatosCargos[key].nombre;
        selectCargo.appendChild(opt);

        // Para el selector del modal de creación
        if(selectCargoModal) {
            let optModal = document.createElement('option');
            optModal.value = key;
            optModal.textContent = baseDatosCargos[key].nombre;
            selectCargoModal.appendChild(optModal);
        }
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

    // Descripción de la dinámica
    document.getElementById('dinamicaDescripcion').innerHTML = `
        <p><strong>Dinámica:</strong> ${dinamicaSeleccionada.titulo}</p>
        <p class="dynamics-list"><strong>Objetivo / Consigna:</strong> ${dinamicaSeleccionada.desc}</p>
    `;

    // Construir filas de competencias
    let filasCompetenciasHTML = '';
    datosCargo.competencias.forEach(c => {
        filasCompetenciasHTML += `
            <tr>
                <td style="width: 35%;"><strong>${c.comp}</strong><br><span style="font-size:11px; color:#666;">${c.desc}</span></td>
                <td style="width: 45%;">Comportamiento observado:</td>
                <td style="width: 20%; text-align: center;">[ &nbsp; &nbsp; ] / 5</td>
            </tr>
        `;
    });

    // Contenedor de postulantes
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

// Funciones para el Modal de Creación de Dinámicas
function abrirModalCrear() {
    document.getElementById('modalCrear').style.display = 'block';
}

function cerrarModalCrear() {
    document.getElementById('modalCrear').style.display = 'none';
}

function guardarNuevaDinamica(event) {
    event.preventDefault();

    const cargoKey = document.getElementById('nuevoCargoSelect').value;
    const titulo = document.getElementById('nuevoTitulo').value.trim();
    const desc = document.getElementById('nuevaDesc').value.trim();

    if (!titulo || !desc) {
        alert("Por favor completa todos los campos.");
        return;
    }

    // Agregar la nueva dinámica al cargo correspondiente
    baseDatosCargos[cargoKey].dinamicas.push({
        titulo: titulo,
        desc: desc
    });

    // Guardar cambios en el almacenamiento local
    guardarEnLocal();

    // Actualizar selectores en pantalla
    actualizarDinamicas();
    
    // Seleccionar automáticamente la nueva dinámica creada
    const selectDinamica = document.getElementById('tipoDinamica');
    selectDinamica.value = selectDinamica.options.length - 1;
    generarEvaluacion();

    // Limpiar formulario y cerrar modal
    document.getElementById('formNuevaDinamica').reset();
    cerrarModalCrear();
    
    alert("¡Dinámica creada y guardada con éxito!");
}

// Función para restablecer los datos originales de fábrica
function reiniciarDatosOriginales() {
    if(confirm("¿Estás seguro de restablecer las dinámicas originales? Se borrarán las personalizadas.")) {
        localStorage.removeItem('psicotecnico_datos');
        location.reload();
    }
}

window.onload = cargarDatos;