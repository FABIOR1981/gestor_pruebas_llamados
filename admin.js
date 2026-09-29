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
        alert("Asegúrate de correr esta página desde un servidor local o Netlify.");
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

// ==========================================
// LÓGICA DE AUTOGENERACIÓN DE CÓDIGOS
// ==========================================

function actualizarCodigoDinamicaAutogenerado() {
    const cargoKey = document.getElementById('modalCargo').value; // Ej: SUP-ENC-01
    const isEditMode = document.getElementById('editIndex').value !== "";

    if (isEditMode) return; // Si estamos editando, no cambiamos el ID.

    // Extraer la especialidad del cargo (ej: de SUP-ENC-01 sacamos ENC)
    const partes = cargoKey.split('-');
    if (partes.length < 2) return;
    const especialidad = partes[1]; 
    const prefijo = `DIN-${especialidad}-`; // Ej: DIN-ENC-

    // Buscar correlativo máximo
    let max = 0;
    baseDatosGlobal.dinamicas.forEach(din => {
        if (din.id.startsWith(prefijo)) {
            const numStr = din.id.replace(prefijo, '');
            const num = parseInt(numStr, 10);
            if (!isNaN(num) && num > max) {
                max = num;
            }
        }
    });

    // Asignar el siguiente número (ej: DIN-ENC-03)
    const nextNum = String(max + 1).padStart(2, '0');
    document.getElementById('modalCodigo').value = `${prefijo}${nextNum}`;
}

function actualizarCodigoCargoAutogenerado() {
    const area = document.getElementById('cargoArea').value; // Ej: SUP
    let especialidad = document.getElementById('cargoEspecialidad').value.toUpperCase().trim().substring(0,3);
    
    if (especialidad.length === 0) {
        document.getElementById('cargoKeyInput').value = "";
        return;
    }
    // Si escribe menos de 3, rellenamos con X (Ej: VE -> VEX) para mantener formato
    while(especialidad.length < 3) especialidad += 'X';

    const prefijo = `${area}-${especialidad}-`;

    let max = 0;
    Object.keys(baseDatosGlobal.cargos).forEach(key => {
        if (key.startsWith(prefijo)) {
            const numStr = key.replace(prefijo, '');
            const num = parseInt(numStr, 10);
            if (!isNaN(num) && num > max) {
                max = num;
            }
        }
    });

    const nextNum = String(max + 1).padStart(2, '0');
    document.getElementById('cargoKeyInput').value = `${prefijo}${nextNum}`;
}

// ==========================================
// MODALES Y GUARDADO
// ==========================================

function abrirModalDinamica() {
    document.getElementById('modalTitulo').textContent = "Nueva Dinámica";
    document.getElementById('editIndex').value = ""; 
    document.getElementById('formDinamica').reset();
    
    const cargoActual = document.getElementById('cargoSelectAdmin').value;
    document.getElementById('modalCargo').value = cargoActual;
    
    // Autogenerar código al abrir
    actualizarCodigoDinamicaAutogenerado();
    
    document.getElementById('modalDinamica').style.display = 'flex';
}

function cerrarModalDinamica() {
    document.getElementById('modalDinamica').style.display = 'none';
}

function editarDinamica(dinId) {
    const din = baseDatosGlobal.dinamicas.find(d => d.id === dinId);
    if (!din) return;

    document.getElementById('modalTitulo').textContent = "Editar Dinámica";
    document.getElementById('editIndex').value = din.id; 
    document.getElementById('modalCargo').value = din.cargo_id;
    document.getElementById('modalCodigo').value = din.id; // En edición se mantiene el código original
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
        if (baseDatosGlobal.dinamicas.some(d => d.id === idIngresado)) {
            alert("Error de sistema: El código autogenerado ya existe.");
            return;
        }
        baseDatosGlobal.dinamicas.push(nuevaDin);
    } else {
        const index = baseDatosGlobal.dinamicas.findIndex(d => d.id === dinIdEditando);
        if (index !== -1) {
            baseDatosGlobal.dinamicas[index] = nuevaDin;
        }
    }

    cerrarModalDinamica();
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
    document.getElementById('cargoKeyInput').value = ""; // Limpiar cálculo previo
    document.getElementById('modalCargoNuevo').style.display = 'flex';
}

function cerrarModalCargo() {
    document.getElementById('modalCargoNuevo').style.display = 'none';
}

function guardarCargo(event) {
    event.preventDefault();
    const key = document.getElementById('cargoKeyInput').value.trim();
    const nombre = document.getElementById('cargoNombreInput').value.trim();

    if (!key) {
        alert("Complete el área y especialidad para generar el código del cargo.");
        return;
    }

    if (baseDatosGlobal.cargos[key]) {
        alert("El sistema intentó sobreescribir un código existente. Contacte soporte.");
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
    alert(`¡Cargo '${nombre}' [${key}] creado con éxito!`);
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