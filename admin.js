let baseDatosGlobal = { areas: {}, cargos: {}, dinamicas: [] };
let cambiosPendientes = false;
const MAX_COMPETENCIAS = 20;

function pintarEstado() {
    const el = document.getElementById('estadoCarga');
    if (cambiosPendientes) {
        el.textContent = "Cambios sin guardar";
        el.style.color = "var(--danger)";
        return;
    }
    el.textContent = Datos.origen === 'bd'
        ? "Datos cargados desde bd/pruebas_llamados"
        : "Datos locales (al guardar se crearán en bd/pruebas_llamados)";
    el.style.color = "var(--success)";
}

function marcarCambios() {
    cambiosPendientes = true;
    pintarEstado();
}

window.addEventListener('beforeunload', e => {
    if (cambiosPendientes) { e.preventDefault(); e.returnValue = ''; }
});

window.onload = async function() {
    try {
        baseDatosGlobal = await Datos.cargar();

        pintarEstado();
        
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
        contenedor.innerHTML = '<div style="padding: 1.25rem; text-align: center; color: #777; background: white; border: 1px solid var(--border); border-radius: 0.375rem;">No hay dinámicas registradas para este cargo.</div>';
        return;
    }

    dinamicasFiltradas.forEach((din) => {
        contenedor.innerHTML += `
            <div class="dynamics-card">
                <div class="dynamics-info">
                    <h4><span style="font-family: monospace; background: var(--light); padding: 2px 0.375rem; border-radius: 0.25rem; font-size: 0.8125rem; color: var(--accent);">[${din.id}]</span> ${din.titulo}</h4>
                    <p><strong>Tiempo Límite:</strong> ${din.tiempo_limite || 'N/A'}</p>
                    <p><strong>Descripción:</strong> ${din.desc}</p>
                </div>
                <div class="actions">
                    <button onclick="editarDinamica('${din.id}')">✏️ Editar</button>
                    <button class="btn-secondary" onclick="duplicarDinamica('${din.id}')">📄 Duplicar</button>
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
    marcarCambios();
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
    
    document.getElementById('btnGuardarOtra').style.display = '';
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
    const hoja = separarRenglones(din.hoja_postulante || '');
    document.getElementById('modalHoja').value = hoja.texto;
    document.getElementById('modalRenglones').value = hoja.renglones;
    document.getElementById('modalCaso').value = din.caso_o_consigna || '';
    document.getElementById('modalPeso').value = din.peso || 1;
    document.getElementById('modalGuia').value = din.guia_evaluacion || '';
    document.getElementById('modalRespuesta').value = din.respuesta_esperada || '';
    
    document.getElementById('btnGuardarOtra').style.display = 'none';
    document.getElementById('modalDinamica').style.display = 'flex';
}

// Los renglones finales se editan en un campo numérico aparte, no como HTML dentro del texto.
const REGEX_RENGLONES_FINALES = /(?:<div class=['"]renglon-respuesta['"]><\/div>)+\s*$/;

function separarRenglones(html) {
    const final = html.match(REGEX_RENGLONES_FINALES);
    const renglones = final ? (final[0].match(/<div/g) || []).length : 0;
    const texto = html.replace(REGEX_RENGLONES_FINALES, '').replace(/&nbsp;/g, '\u00a0').trim();
    return { texto, renglones };
}

function componerHoja(texto, renglones) {
    const cuerpo = texto.replace(/\u00a0/g, '&nbsp;').trim();
    const cantidad = Math.min(Math.max(parseInt(renglones, 10) || 0, 0), 30);
    return cantidad > 0
        ? `${cuerpo}\n\n${"<div class='renglon-respuesta'></div>".repeat(cantidad)}`
        : cuerpo;
}

function guardarDinamica(event, crearOtra = false) {
    event.preventDefault();
    if (crearOtra && !document.getElementById('formDinamica').reportValidity()) return;
    const cargoKey = document.getElementById('modalCargo').value;
    const dinIdEditando = document.getElementById('editIndex').value;
    const idIngresado = document.getElementById('modalCodigo').value.trim();

    const nuevaDin = {
        id: idIngresado,
        cargo_id: cargoKey,
        titulo: document.getElementById('modalTituloDin').value.trim(),
        desc: document.getElementById('modalDesc').value.trim(),
        tiempo_limite: document.getElementById('modalTiempo').value.trim(),
        peso: Math.min(Math.max(parseInt(document.getElementById('modalPeso').value, 10) || 1, 1), 5),
        hoja_postulante: componerHoja(document.getElementById('modalHoja').value, document.getElementById('modalRenglones').value),
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
    marcarCambios();
    if (crearOtra) {
        abrirModalDinamica();
        return;
    }
    alert("¡Dinámica guardada! Haz clic en 'Guardar en GitHub' cuando termines.");
}

// Abre el formulario como dinámica nueva (código nuevo) con los datos de otra ya existente.
function duplicarDinamica(dinId) {
    const din = baseDatosGlobal.dinamicas.find(d => d.id === dinId);
    if (!din) return;

    document.getElementById('modalTitulo').textContent = "Nueva Dinámica (copia de " + din.id + ")";
    document.getElementById('editIndex').value = "";
    document.getElementById('modalCargo').value = din.cargo_id;
    actualizarCodigoDinamicaAutogenerado();
    document.getElementById('modalTituloDin').value = (din.titulo || '') + ' (copia)';
    document.getElementById('modalDesc').value = din.desc || '';
    document.getElementById('modalTiempo').value = din.tiempo_limite || '';
    const hoja = separarRenglones(din.hoja_postulante || '');
    document.getElementById('modalHoja').value = hoja.texto;
    document.getElementById('modalRenglones').value = hoja.renglones;
    document.getElementById('modalCaso').value = din.caso_o_consigna || '';
    document.getElementById('modalPeso').value = din.peso || 1;
    document.getElementById('modalGuia').value = din.guia_evaluacion || '';
    document.getElementById('modalRespuesta').value = din.respuesta_esperada || '';

    document.getElementById('btnGuardarOtra').style.display = '';
    document.getElementById('modalDinamica').style.display = 'flex';
}

function eliminarDinamica(dinId) {
    if (confirm(`¿Estás seguro de eliminar la dinámica ${dinId}?`)) {
        baseDatosGlobal.dinamicas = baseDatosGlobal.dinamicas.filter(d => d.id !== dinId);
        renderizarDinamicas();
        marcarCambios();
    }
}

function filaCompetencia(c) {
    const fila = document.createElement('div');
    fila.className = 'fila-competencia';

    const codigo = document.createElement('input');
    codigo.type = 'text'; codigo.maxLength = 12;
    codigo.className = 'competencia-codigo';
    codigo.placeholder = 'Código'; codigo.value = c.codigo || '';

    const nombre = document.createElement('input');
    nombre.type = 'text'; nombre.maxLength = 60; nombre.required = true;
    nombre.className = 'competencia-nombre';
    nombre.placeholder = 'Competencia'; nombre.value = c.comp || '';

    const desc = document.createElement('input');
    desc.type = 'text'; desc.maxLength = 200; desc.required = true;
    desc.className = 'competencia-desc';
    desc.placeholder = 'Qué se observa'; desc.value = c.desc || '';

    const quitar = document.createElement('button');
    quitar.type = 'button'; quitar.className = 'btn-danger'; quitar.textContent = '✕';
    quitar.setAttribute('aria-label', 'Quitar competencia');
    quitar.onclick = () => {
        if (document.getElementById('listaCompetencias').children.length <= 1) {
            alert("El cargo necesita al menos una competencia.");
            return;
        }
        fila.remove();
    };

    fila.append(codigo, nombre, desc, quitar);
    return fila;
}

function agregarCompetencia(c = {}) {
    const lista = document.getElementById('listaCompetencias');
    if (lista.children.length >= MAX_COMPETENCIAS) {
        alert(`Máximo ${MAX_COMPETENCIAS} competencias por cargo.`);
        return;
    }
    lista.appendChild(filaCompetencia(c));
}

function leerCompetencias() {
    return [...document.getElementById('listaCompetencias').children]
        .map(f => ({
            codigo: f.children[0].value.trim(),
            comp: f.children[1].value.trim(),
            desc: f.children[2].value.trim()
        }))
        .filter(c => c.comp);
}

function abrirModalCargo() {
    document.getElementById('formCargo').reset();
    document.getElementById('cargoEditKey').value = "";
    document.getElementById('cargoKeyInput').value = "";
    document.getElementById('tituloModalCargo').textContent = "Crear Nuevo Cargo";
    document.getElementById('btnGuardarCargo').textContent = "Crear Cargo";
    document.getElementById('cargoAreaSelect').disabled = false;
    document.getElementById('cargoEspecialidad').disabled = false;
    document.getElementById('listaCompetencias').innerHTML = '';
    for (let i = 0; i < 3; i++) agregarCompetencia();
    document.getElementById('modalCargoNuevo').style.display = 'flex';
}

function editarCargo() {
    const key = document.getElementById('cargoSelectAdmin').value;
    const cargo = baseDatosGlobal.cargos[key];
    if (!cargo) return;

    const [, sigla, especialidad] = key.split('-');
    document.getElementById('formCargo').reset();
    document.getElementById('cargoEditKey').value = key;
    document.getElementById('tituloModalCargo').textContent = "Editar Cargo y Competencias";
    document.getElementById('btnGuardarCargo').textContent = "Guardar Cambios";
    document.getElementById('cargoNombreInput').value = cargo.nombre;
    document.getElementById('cargoAreaSelect').value = sigla;
    document.getElementById('cargoAreaSelect').disabled = true;
    document.getElementById('cargoEspecialidad').value = especialidad || '';
    document.getElementById('cargoEspecialidad').disabled = true;
    document.getElementById('cargoKeyInput').value = key;
    document.getElementById('listaCompetencias').innerHTML = '';
    (cargo.competencias || []).forEach(c => agregarCompetencia(c));
    if (!document.getElementById('listaCompetencias').children.length) agregarCompetencia();
    document.getElementById('modalCargoNuevo').style.display = 'flex';
}

function cerrarModalCargo() {
    document.getElementById('modalCargoNuevo').style.display = 'none';
}

function guardarCargo(event) {
    event.preventDefault();
    const competencias = leerCompetencias();
    if (competencias.length === 0) {
        alert("Defina al menos una competencia.");
        return;
    }
    const nombresComp = competencias.map(c => c.comp.toLowerCase());
    if (new Set(nombresComp).size !== nombresComp.length) {
        alert("Hay competencias repetidas.");
        return;
    }
    const codigosComp = competencias.map(c => c.codigo).filter(Boolean);
    if (new Set(codigosComp).size !== codigosComp.length) {
        alert("Hay códigos de competencia repetidos.");
        return;
    }

    const editKey = document.getElementById('cargoEditKey').value;
    const nombre = document.getElementById('cargoNombreInput').value.trim();

    if (editKey) {
        baseDatosGlobal.cargos[editKey].nombre = nombre;
        baseDatosGlobal.cargos[editKey].competencias = competencias;
        cerrarModalCargo();
        inicializarAdmin();
        document.getElementById('cargoSelectAdmin').value = editKey;
        renderizarDinamicas();
        marcarCambios();
        alert(`Cargo '${nombre}' [${editKey}] actualizado.`);
        return;
    }

    const key = document.getElementById('cargoKeyInput').value.trim();
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
        competencias: competencias
    };

    cerrarModalCargo();
    inicializarAdmin();
    document.getElementById('cargoSelectAdmin').value = key;
    renderizarDinamicas();
    marcarCambios();
    alert(`¡Cargo '${nombre}' [${key}] creado con éxito!`);
}

function abrirModalGuardar() {
    document.getElementById('formGuardar').reset();
    document.getElementById('avGuardar').textContent = '';
    document.getElementById('modalGuardar').style.display = 'flex';
    document.getElementById('pwGuardar').focus();
}

function cerrarModalGuardar() {
    document.getElementById('modalGuardar').style.display = 'none';
}

async function confirmarGuardado(event) {
    event.preventDefault();
    const boton = document.getElementById('btnConfirmarGuardado');
    const aviso = document.getElementById('avGuardar');
    boton.disabled = true;
    aviso.style.color = '#555';
    aviso.textContent = 'Guardando…';
    try {
        const r = await Datos.guardar(baseDatosGlobal, document.getElementById('pwGuardar').value);
        cambiosPendientes = false;
        pintarEstado();
        cerrarModalGuardar();
        alert(r.escritos.length ? `Guardado en GitHub: ${r.escritos.join(', ')}.` : 'No había cambios para guardar.');
    } catch (error) {
        aviso.style.color = 'var(--danger)';
        aviso.textContent = error.message;
    }
    boton.disabled = false;
}