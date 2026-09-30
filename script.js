let baseDatosGlobal = { areas: {}, cargos: {}, dinamicas: [] };

async function cargarDatos() {
    try {
        const response = await fetch('datos.json');
        if (!response.ok) throw new Error('No se pudo cargar datos.json');
        baseDatosGlobal = await response.json();
        if (!baseDatosGlobal.areas) baseDatosGlobal.areas = {};
        if (!baseDatosGlobal.cargos) baseDatosGlobal.cargos = {};
        if (!Array.isArray(baseDatosGlobal.dinamicas)) baseDatosGlobal.dinamicas = [];
        inicializarSelectCargos();
    } catch (error) {
        console.error('Error al cargar el archivo JSON:', error);
        alert('Error de conexión. Asegúrate de correr la app en Netlify o un servidor local.');
    }
}

function inicializarSelectCargos() {
    const selectCargo = document.getElementById('cargoSelect');
    selectCargo.innerHTML = '';

    for (const key in baseDatosGlobal.cargos) {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = `[${key}] ${baseDatosGlobal.cargos[key].nombre}`;
        selectCargo.appendChild(opt);
    }

    actualizarDinamicas();
}

// Se ejecuta al cambiar el cargo: recarga las dinámicas y limpia la pantalla para evitar datos cruzados
function actualizarDinamicas() {
    limpiarResultados();

    const cargoKey = document.getElementById('cargoSelect').value; // Ej: CAR-SUP-ENC-01
    const selectDinamica = document.getElementById('tipoDinamica');
    selectDinamica.innerHTML = '';

    if (!baseDatosGlobal.cargos[cargoKey]) return;

    // Solo las dinámicas cuyo cargo_id coincide exactamente con el cargo elegido
    const dinamicasFiltradas = baseDatosGlobal.dinamicas.filter((din) => din.cargo_id === cargoKey);

    if (dinamicasFiltradas.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No hay dinámicas para este cargo';
        selectDinamica.appendChild(opt);
        return;
    }

    dinamicasFiltradas.forEach((din) => {
        const opt = document.createElement('option');
        opt.value = din.id; // ID único (ej: DIN-SUP-ENC-01)
        opt.textContent = `[${din.id}] ${din.titulo}`;
        selectDinamica.appendChild(opt);
    });
}

// Blanquea la pantalla de resultados
function limpiarResultados() {
    document.getElementById('cargoTitulo').textContent = 'Cargo: -';
    document.getElementById('dinamicaDescripcion').innerHTML =
        '<p class="texto-placeholder">Selección modificada. Presione "Generar Formulario" para actualizar los datos.</p>';
    document.getElementById('contenedorPostulantes').innerHTML = '';
    document.getElementById('materialPostulanteContenido').innerHTML = '';
}

function generarEvaluacion() {
    const cargoKey = document.getElementById('cargoSelect').value;
    const dinamicaId = document.getElementById('tipoDinamica').value;
    const numIngresado = parseInt(document.getElementById('numPostulantes').value, 10) || 1;
    const numPostulantes = Math.min(10, Math.max(1, numIngresado));

    if (!baseDatosGlobal.cargos[cargoKey]) return;

    const datosCargo = baseDatosGlobal.cargos[cargoKey];
    const dinamica = baseDatosGlobal.dinamicas.find((din) => din.id === dinamicaId);

    if (!dinamica) {
        alert('Por favor seleccione una dinámica válida.');
        return;
    }

    document.getElementById('cargoTitulo').textContent = `Cargo Objetivo: [${cargoKey}] ${datosCargo.nombre}`;

    // Todo texto que viene del JSON se escapa antes de entrar a innerHTML
    const materialTexto = esc(dinamica.hoja_postulante || 'Sin material específico definido.');
    const casoTexto = esc(dinamica.caso_o_consigna || 'Sin objetivo específico.');
    const guiaHTML = esc(dinamica.guia_evaluacion || 'Sin guía específica.').replace(/\r?\n/g, '<br>');
    const tiempoTexto = esc(dinamica.tiempo_limite || 'Sin límite especificado');
    const codigoDin = esc(dinamica.id);

    // Informe para el evaluador
    document.getElementById('dinamicaDescripcion').innerHTML = `
        <p><strong>Dinámica:</strong> ${esc(dinamica.titulo)} <span class="id-badge">ID: ${codigoDin}</span></p>
        <p class="dynamics-list"><strong>Descripción:</strong> ${esc(dinamica.desc)}</p>
        <div class="caja-nota caja-tiempo">
            <strong>⏱️ Tiempo Límite de la Prueba:</strong> <span class="valor">${tiempoTexto}</span>
        </div>
        <div class="caja-nota caja-objetivo">
            <strong>🎯 Objetivo de la Prueba:</strong><br>
            ${casoTexto}
        </div>
        <div class="caja-nota caja-guia">
            <strong>🔍 Guía de Observación para el Evaluador:</strong><br>
            ${guiaHTML}
        </div>
    `;

    const filasCompetenciasHTML = (datosCargo.competencias || []).map((c) => `
            <tr>
                <td class="col-competencia"><strong>${esc(c.comp)}</strong><br><span class="competencia-desc">${esc(c.desc)}</span></td>
                <td class="col-notas"></td>
                <td class="col-puntaje">[ &nbsp; &nbsp; ] / 5</td>
            </tr>
        `).join('');

    const bloquesPostulantes = [];
    const hojasPostulantes = [];

    for (let i = 1; i <= numPostulantes; i++) {
        bloquesPostulantes.push(`
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
                <div class="observaciones-titulo">Observaciones específicas del postulante:</div>
                <div class="observations-box"></div>
            </div>
        `);

        hojasPostulantes.push(`
            <div class="candidate-sheet">
                <h3 class="hoja-titulo">HOJA DE TRABAJO / CONSIGNA</h3>
                <div class="hoja-datos">
                    <div class="hoja-fila">
                        <div class="hoja-nombre">
                            <strong>Nombre del Postulante:</strong> __________________________________________________
                        </div>
                        <div>
                            <strong>Fecha:</strong> ____/____/20___
                        </div>
                    </div>
                    <div class="hoja-fila">
                        <div>
                            <strong>Dinámica ID:</strong> <span class="id-badge">${codigoDin}</span>
                        </div>
                        <div class="hoja-tiempo">⏱️ Tiempo Límite: ${tiempoTexto}</div>
                    </div>
                </div>
                <div class="hoja-consigna">${materialTexto}</div>
            </div>
        `);
    }

    document.getElementById('contenedorPostulantes').innerHTML = bloquesPostulantes.join('');
    document.getElementById('materialPostulanteContenido').innerHTML = hojasPostulantes.join('');
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('cargoSelect').addEventListener('change', actualizarDinamicas);
    document.getElementById('tipoDinamica').addEventListener('change', limpiarResultados);
    document.getElementById('btnGenerar').addEventListener('click', generarEvaluacion);
    document.getElementById('btnImprimir').addEventListener('click', () => window.print());
    cargarDatos();
});
