let baseDatosGlobal = { cargos: {} };

window.onload = async function() {
    try {
        const response = await fetch('datos.json');
        if (!response.ok) throw new Error("No se pudo cargar datos.json");
        const data = await response.json();
        baseDatosGlobal = data;
        
        document.getElementById('estadoCarga').textContent = "Conectado a datos.json";
        document.getElementById('estadoCarga').style.color = "var(--success)";
        
        inicializarAdmin();
    } catch (error) {
        console.error("Error al cargar datos.json:", error);
        document.getElementById('estadoCarga').textContent = "Error al leer datos.json";
        document.getElementById('estadoCarga').style.color = "var(--danger)";
        alert("Asegúrate de correr esta página desde un servidor local (Live Server) o Netlify para que lea el archivo JSON.");
    }
};

function inicializarAdmin() {
    const selectCargo = document.getElementById('cargoSelectAdmin');
    const modalCargo = document.getElementById('modalCargo');
    selectCargo.innerHTML = '';
    modalCargo.innerHTML = '';

    for (const key in baseDatosGlobal.cargos) {
        let nombreCargo = baseDatosGlobal.cargos[key].nombre;
        
        let opt1 = document.createElement('option');
        opt1.value = key; opt1.textContent = nombreCargo;
        selectCargo.appendChild(opt1);

        let opt2 = document.createElement('option');
        opt2.value = key; opt2.textContent = nombreCargo;
        modalCargo.appendChild(opt2);
    }
    renderizarDinamicas();
}

function renderizarDinamicas() {
    const cargoKey = document.getElementById('cargoSelectAdmin').value;
    const contenedor = document.getElementById('listaDinamicas');
    contenedor.innerHTML = '';

    if (!baseDatosGlobal.cargos[cargoKey]) return;

    const cargoActual = baseDatosGlobal.cargos[cargoKey];
    document.getElementById('tituloListaCargo').textContent = `Dinámicas del Cargo: ${cargoActual.nombre}`;

    const dinamicas = cargoActual.dinamicas || [];

    if (dinamicas.length === 0) {
        contenedor.innerHTML = '<div style="padding: 20px; text-align: center; color: #777; background: white; border: 1px solid var(--border); border-radius: 6px;">No hay dinámicas registradas para este cargo.</div>';
        return;
    }

    dinamicas.forEach((din, index) => {
        contenedor.innerHTML += `
            <div class="dynamics-card">
                <div class="dynamics-info">
                    <h4><span style="font-family: monospace; background: var(--light); padding: 2px 6px; border-radius: 4px; font-size: 13px; color: var(--accent);">[${din.codigo || 'S/C'}]</span> ${din.titulo}</h4>
                    <p><strong>Tiempo Límite:</strong> ${din.tiempo_limite || 'N/A'}</p>
                    <p><strong>Descripción:</strong> ${din.desc}</p>
                </div>
                <div class="actions">
                    <button onclick="editarDinamica('${cargoKey}', ${index})">✏️ Editar</button>
                    <button class="btn-danger" onclick="eliminarDinamica('${cargoKey}', ${index})">🗑️ Borrar</button>
                </div>
            </div>
        `;
    });
}

// Funciones Modal Dinámica
function abrirModalDinamica() {
    document.getElementById('modalTitulo').textContent = "Nueva Dinámica";
    document.getElementById('editIndex').value = "-1";
    document.getElementById('formDinamica').reset();
    document.getElementById('modalDinamica').style.display = 'flex';
}

function cerrarModalDinamica() {
    document.getElementById('modalDinamica').style.display = 'none';
}

function editarDinamica(cargoKey, index) {
    const din = baseDatosGlobal.cargos[cargoKey].dinamicas[index];
    document.getElementById('modalTitulo').textContent = "Editar Dinámica";
    document.getElementById('editIndex').value = index;
    document.getElementById('modalCargo').value = cargoKey;
    document.getElementById('modalCodigo').value = din.codigo || '';
    document.getElementById('modalTituloDin').value = din.titulo || '';
    document.getElementById('modalDesc').value = din.desc || '';
    document.getElementById('modalTiempo').value = din.tiempo_limite || '';
    document.getElementById('modalHoja').value = din.hoja_postulante || '';
    document.getElementById('modalCaso').value = din.caso_o_consigna || '';
    document.getElementById('modalGuia').value = din.guia_evaluacion || '';
    
    document.getElementById('modalDinamica').style.display = 'flex';
}

function guardarDinamica(event) {
    event.preventDefault();
    const cargoKey = document.getElementById('modalCargo').value;
    const index = parseInt(document.getElementById('editIndex').value);

    const nuevaDin = {
        codigo: document.getElementById('modalCodigo').value.trim(),
        titulo: document.getElementById('modalTituloDin').value.trim(),
        desc: document.getElementById('modalDesc').value.trim(),
        tiempo_limite: document.getElementById('modalTiempo').value.trim(),
        hoja_postulante: document.getElementById('modalHoja').value.trim(),
        caso_o_consigna: document.getElementById('modalCaso').value.trim(),
        guia_evaluacion: document.getElementById('modalGuia').value.trim()
    };

    if (index === -1) {
        if (!baseDatosGlobal.cargos[cargoKey].dinamicas) {
            baseDatosGlobal.cargos[cargoKey].dinamicas = [];
        }
        baseDatosGlobal.cargos[cargoKey].dinamicas.push(nuevaDin);
    } else {
        baseDatosGlobal.cargos[cargoKey].dinamicas[index] = nuevaDin;
    }

    cerrarModalDinamica();
    renderizarDinamicas();
    alert("¡Dinámica guardada! No olvides hacer clic en 'Descargar JSON Actualizado' cuando termines.");
}

function eliminarDinamica(cargoKey, index) {
    if (confirm("¿Estás seguro de eliminar esta dinámica?")) {
        baseDatosGlobal.cargos[cargoKey].dinamicas.splice(index, 1);
        renderizarDinamicas();
    }
}

// Funciones Modal Cargo Nuevo
function abrirModalCargo() {
    document.getElementById('formCargo').reset();
    document.getElementById('modalCargoNuevo').style.display = 'flex';
}

function cerrarModalCargo() {
    document.getElementById('modalCargoNuevo').style.display = 'none';
}

function guardarCargo(event) {
    event.preventDefault();
    const key = document.getElementById('cargoKeyInput').value.trim().toLowerCase().replace(/\s+/g, '_');
    const nombre = document.getElementById('cargoNombreInput').value.trim();

    if (baseDatosGlobal.cargos[key]) {
        alert("Ya existe un cargo con ese identificador. Elige otro.");
        return;
    }

    // Crear la estructura base para el nuevo cargo
    baseDatosGlobal.cargos[key] = {
        nombre: nombre,
        dinamicas: [],
        competencias: [
            { comp: "Competencia General 1", desc: "Descripción de ejemplo a modificar." }
        ]
    };

    cerrarModalCargo();
    inicializarAdmin();
    document.getElementById('cargoSelectAdmin').value = key;
    renderizarDinamicas();
    alert(`¡Cargo '${nombre}' creado con éxito!`);
}

function descargarJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(baseDatosGlobal, null, 4));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "datos.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}