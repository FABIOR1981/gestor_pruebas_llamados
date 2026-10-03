let baseDatosGlobal = { areas: {}, cargos: {}, dinamicas: [] };

window.onload = async function() {
    try {
        baseDatosGlobal = await Datos.cargar();

        document.getElementById('estadoCarga').textContent = "Datos cargados";
        document.getElementById('estadoCarga').style.color = "var(--success)";
        
        inicializarAdmin();
    } catch (error) {
        console.error("Error al cargar los datos:", error);
        document.getElementById('estadoCarga').textContent = "Error al leer los datos";
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
    
    cargarSelectAreas();
    renderizarDinamicas();
}

function cargarSelectAreas() {
    const selectArea = document.getElementById('cargoAreaSelect');
    if (!selectArea) return;
    
    selectArea.innerHTML = '<option value="" disabled selected>Seleccione un área...</option>';
    
    for (const sigla in baseDatosGlobal.areas) {
        let opt = document.createElement('option');
        opt.value = sigla;
        opt.textContent = `[${sigla}] ${baseDatosGlobal.areas[sigla].nombre}`;
        selectArea.appendChild(opt);
    }
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

function abrirModalArea() {
    document.getElementById('formArea').reset();
    document.getElementById('modalAreaNueva').style.display = 'flex';
}

function cerrarModalArea() {
    document.getElementById('modalAreaNueva').style.display = 'none';
}

function guardarArea(event) {
    event.preventDefault();
    const sigla = document.getElementById('areaSiglaNueva').value.toUpperCase().trim();
    const nombre = document.getElementById('areaNombreNueva').value.trim();

    if (sigla.length !== 3) {
        alert("La sigla debe tener exactamente 3 letras.");
        return;
    }

    if (baseDatosGlobal.areas[sigla]) {
        alert("Ya existe un área con esa sigla.");
        return;
    }

    baseDatosGlobal.areas[sigla] = { nombre: nombre };
    cerrarModalArea();
    cargarSelectAreas();
    alert(`Área '${nombre}' [${sigla}] creada con éxito.`);
}

function actualizarCodigoDinamicaAutogenerado() {
    const cargoKey = document.getElementById('modalCargo').value; // Ej: CAR-SUP-ENC-01
    const isEditMode = document.getElementById('editIndex').value !== "";

    if (isEditMode) return; 

    // Extraer área y especialidad del cargo (Ej: de CAR-SUP-ENC-01 sacamos SUP y ENC)
    const partes = cargoKey.split('-');
    if (partes.length < 4) return;
    const area = partes[1];
    const especialidad = partes[2];
    
    const prefijo = `DIN-${area}-${especialidad}-`; // Ej: DIN-SUP-ENC-

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

    const nextNum = String(max + 1).padStart(2, '0');
    document.getElementById('modalCodigo').value = `${prefijo}${nextNum}`;
}

function actualizarCodigoCargoAutogenerado() {
    const selectArea = document.getElementById('cargoAreaSelect');
    let areaSigla = selectArea.value;
    let especialidad = document.getElementById('cargoEspecialidad').value.toUpperCase().trim().substring(0,3);
    
    if (!areaSigla || especialidad.length === 0) {
        document.getElementById('cargoKeyInput').value = "";
        return;
    }

    while(especialidad.length < 3) especialidad += 'X';

    const prefijo = `CAR-${areaSigla}-${especialidad}-`; // Ej: CAR-SUP-ENC-

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

function abrirModalDinamica() {
    document.getElementById('modalTitulo').textContent = "Nueva Dinámica";
    document.getElementById('editIndex').value = ""; 
    document.getElementById('formDinamica').reset();
    
    const cargoActual = document.getElementById('cargoSelectAdmin').value;
    document.getElementById('modalCargo').value = cargoActual;
    
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
    document.getElementById('modalCodigo').value = din.id; 
    document.getElementById('modalTituloDin').value = din.titulo || '';
    document.getElementById('modalDesc').value = din.desc || '';
    document.getElementById('modalTiempo').value = din.tiempo_limite || '';
    document.getElementById('modalHoja').value = hojaParaEditar(din.hoja_postulante || '');
    document.getElementById('modalCaso').value = din.caso_o_consigna || '';
    document.getElementById('modalGuia').value = din.guia_evaluacion || '';
    document.getElementById('modalRespuesta').value = din.respuesta_esperada || '';
    
    document.getElementById('modalDinamica').style.display = 'flex';
}

// En el formulario los renglones se escriben como [Renglones para escribir: N] en vez de HTML.
function hojaParaEditar(html) {
    return html
        .replace(/(?:<div class=['"]renglon-respuesta['"]><\/div>)+/g, run => {
            const cantidad = (run.match(/<div/g) || []).length;
            return `[Renglones para escribir: ${cantidad}]`;
        })
        .replace(/&nbsp;/g, '\u00a0');
}

function hojaParaGuardar(texto) {
    return texto
        .replace(/\[Renglones para escribir:\s*(\d+)\s*\]/gi, (_, n) =>
            "<div class='renglon-respuesta'></div>".repeat(Math.min(parseInt(n, 10), 30)))
        .replace(/\u00a0/g, '&nbsp;');
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
        hoja_postulante: hojaParaGuardar(document.getElementById('modalHoja').value.trim()),
        caso_o_consigna: document.getElementById('modalCaso').value.trim(),
        guia_evaluacion: document.getElementById('modalGuia').value.trim(),
        respuesta_esperada: document.getElementById('modalRespuesta').value.trim()
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
    document.getElementById('cargoKeyInput').value = ""; 
    document.getElementById('modalCargoNuevo').style.display = 'flex';
}

function cerrarModalCargo() {
    document.getElementById('modalCargoNuevo').style.display = 'none';
}

function guardarCargo(event) {
    event.preventDefault();
    const key = document.getElementById('cargoKeyInput').value.trim();
    const nombre = document.getElementById('cargoNombreInput').value.trim();
    
    const selectArea = document.getElementById('cargoAreaSelect');
    const areaSigla = selectArea.value;
    const nombreArea = baseDatosGlobal.areas[areaSigla] ? baseDatosGlobal.areas[areaSigla].nombre : areaSigla;

    if (!key) {
        alert("Seleccione un área y complete la especialidad para generar el código.");
        return;
    }

    if (baseDatosGlobal.cargos[key]) {
        alert("El sistema intentó sobreescribir un código existente. Modifique la especialidad.");
        return;
    }

    baseDatosGlobal.cargos[key] = {
        nombre: nombre,
        area: nombreArea,
        competencias: [
            { comp: "Competencia General 1", desc: "Descripción de ejemplo a modificar." },
            { comp: "Competencia General 2", desc: "Descripción de ejemplo a modificar." }
        ]
    };

    cerrarModalCargo();
    inicializarAdmin();
    document.getElementById('cargoSelectAdmin').value = key;
    renderizarDinamicas();
    alert(`¡Cargo '${nombre}' [${key}] creado con éxito!`);
}

function descargarJSON() {
    Datos.exportar(baseDatosGlobal);
}