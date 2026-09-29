let baseDatosGlobal = { cargos: {} };

// Cargar por defecto si está en la misma ruta
window.onload = async function() {
    try {
        const res = await fetch('datos.json');
        const data = await res.json();
        baseDatosGlobal = data;
        inicializarAdmin();
    } catch (e) {
        console.log("Carga un archivo JSON manualmente.");
    }
};

function cargarArchivoJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            baseDatosGlobal = JSON.parse(e.target.result);
            inicializarAdmin();
            alert("¡Archivo JSON cargado con éxito!");
        } catch (err) {
            alert("Error al parsear el archivo JSON.");
        }
    };
    reader.readAsText(file);
}

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

    const dinamicas = baseDatosGlobal.cargos[cargoKey].dinamicas;

    if (dinamicas.length === 0) {
        contenedor.innerHTML = '<p>No hay dinámicas para este cargo.</p>';
        return;
    }

    dinamicas.forEach((din, index) => {
        contenedor.innerHTML += `
            <div class="dynamics-card">
                <div class="dynamics-info">
                    <h4>[${din.codigo || 'S/C'}] ${din.titulo}</h4>
                    <p><strong>Tiempo:</strong> ${din.tiempo_limite || 'N/A'}</p>
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

function abrirModalDinamica() {
    document.getElementById('modalTitulo').textContent = "Nueva Dinámica";
    document.getElementById('editIndex').value = "-1";
    document.getElementById('formDinamica').reset();
    document.getElementById('modalDinamica').style.display = 'flex';
}

function cerrarModal() {
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
        // Nueva
        baseDatosGlobal.cargos[cargoKey].dinamicas.push(nuevaDin);
    } else {
        // Modificación
        baseDatosGlobal.cargos[cargoKey].dinamicas[index] = nuevaDin;
    }

    cerrarModal();
    renderizarDinamicas();
    alert("¡Cambios aplicados en memoria con éxito! Recuerda descargar el JSON actualizado.");
}

function eliminarDinamica(cargoKey, index) {
    if (confirm("¿Estás seguro de eliminar esta dinámica?")) {
        baseDatosGlobal.cargos[cargoKey].dinamicas.splice(index, 1);
        renderizarDinamicas();
    }
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