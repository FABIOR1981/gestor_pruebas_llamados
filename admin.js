let baseDatosGlobal = { cargos: {}, dinamicas: [] };

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
        alert("Asegúrate de correr esta página desde un servidor local (Live Server) o Netlify.");
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
        opt1.value = key; opt1.textContent = `[${key}] ${nombreCargo}`;
        selectCargo.appendChild(opt1);

        let opt2 = document.createElement('option');
        opt2.value = key; opt2.textContent = `[${key}] ${nombreCargo}`;
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
    document.getElementById('tituloListaCargo').textContent = `Dinámicas del Cargo: [${cargoKey}] ${cargoActual.nombre}`;

    // Filtramos del arreglo global de dinámicas
    const dinamicasFiltradas = baseDatosGlobal.dinamicas.filter(din => din.cargo_id === cargoKey);

    if (dinamicasFiltradas.length === 0) {
        contenedor.innerHTML = '<div style="padding: 20px; text-align: center; color: #777; background: white; border: 1px solid var(--border); border-radius: 6px;">No hay dinámicas registradas para este cargo.</div>';
        return;
    }

    dinamicasFiltradas.forEach((din) => {
        contenedor.innerHTML += `
            <div class="dynamics-card">
                <div class="dynamics-info">
                    <h4><span style="font-family: monospace; background: var(--light); padding: 2px 6px; border-radius: 4px; font-size: 13px; color: var(--accent);">[${din.id}]</span> ${din.titulo}</h4>
                    <p><strong>Tiempo Límite:</strong> ${din.tiempo_limite || 'N/A'}</p>
                    <p><strong>Descripción:</strong> ${din.desc}</p>
                </div>
                <div class="actions">
                    <button onclick="editarDinamica('${din.id}')">✏️ Editar</button>
                    <button class="btn-danger" onclick="eliminarDinamica('${din.id}')">🗑️ Borrar</button>
                </div>
            </div>
        `;
    });
}

function abrirModalDinamica() {
    document.getElementById('modalTitulo').textContent = "Nueva Dinámica";
    document.getElementById('editIndex').value = ""; // Usamos el ID en lugar del índice numérico
    document.getElementById('formDinamica').reset();
    
    // Asignar por defecto el cargo actualmente seleccionado en el filtro
    const cargoActual = document.getElementById('cargoSelectAdmin').value;
    document.getElementById('modalCargo').value = cargoActual;
    
    document.getElementById('modalDinamica').style.display = 'flex';
}

function cerrarModalDinamica() {
    document.getElementById('modalDinamica').style.display = 'none';
}

function editarDinamica(dinId) {
    const din = baseDatosGlobal.dinamicas.find(d => d.id === dinId);
    if (!din) return;

    document.getElementById('modalTitulo').textContent = "Editar Dinámica";
    document.getElementById('editIndex').value = din.id; // Guardamos el ID como referencia
    document.getElementById('modalCargo').value = din.cargo_id;
    document.getElementById('modalCodigo').value = din.id;
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
    const dinIdEditando = document.getElementById('editIndex').value;
    const idIngresado = document.getElementById('modalCodigo').value.trim();

    const nuevaDin = {
        id: idIngresado,
        cargo_id: cargoKey,
        titulo: document.getElementById('modalTituloDin').value.trim(),
        desc: document.getElementById('modalDesc').value.trim(),
        tiempo_limite: document.getElementById('modalTiempo').value.trim(),
        hoja_postulante: document.getElementById('modalHoja').value.trim(),
        caso_o_consigna: document.getElementById('modalCaso').value.trim(),
        guia_evaluacion: document.getElementById('modalGuia').value.trim()
    };

    if (!dinIdEditando) {
        // Nueva dinámica
        if (baseDatosGlobal.dinamicas.some(d => d.id === idIngresado)) {
            alert("Ya existe una dinámica con ese ID/Código. Elige uno diferente.");
            return;
        }
        baseDatosGlobal.dinamicas.push(nuevaDin);
    } else {
        // Edición
        const index = baseDatosGlobal.dinamicas.findIndex(d => d.id === dinIdEditando);
        if (index !== -1) {
            baseDatosGlobal.dinamicas[index] = nuevaDin;
        }
    }

    cerrarModalDinamica();
    // Cambiamos el select al cargo donde pertenece para verla reflejada al instante
    document.getElementById('cargoSelectAdmin').value = cargoKey;
    renderizarDinamicas();
    alert("¡Dinámica guardada! Haz clic en 'Descargar JSON Actualizado' cuando termines.");
}

function eliminarDinamica(dinId) {
    if (confirm(`¿Estás seguro de eliminar la dinámica ${dinId}?`)) {
        baseDatosGlobal.dinamicas = baseDatosGlobal.dinamicas.filter(d => d.id !== dinId);
        renderizarDinamicas();
    }
}

function abrirModalCargo() {
    document.getElementById('formCargo').reset();
    document.getElementById('modalCargoNuevo').style.display = 'flex';
}

function cerrarModalCargo() {
    document.getElementById('modalCargoNuevo').style.display = 'none';
}

function guardarCargo(event) {
    event.preventDefault();
    const key = document.getElementById('cargoKeyInput').value.trim();
    const nombre = document.getElementById('cargoNombreInput').value.trim();

    if (baseDatosGlobal.cargos[key]) {
        alert("Ya existe un cargo con ese código clave. Elige otro.");
        return;
    }

    baseDatosGlobal.cargos[key] = {
        nombre: nombre,
        competencias: [
            { comp: "Competencia General", desc: "Descripción de ejemplo a modificar." }
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