# Gestor de Pruebas para Llamados

Aplicación web para armar e imprimir **evaluaciones psicotécnicas** en procesos de selección (llamados). Se elige el cargo, la cantidad de postulantes y las dinámicas, y la app genera:

- el **informe para el evaluador**, con la descripción de cada dinámica, el tiempo total, la guía de observación y las respuestas esperadas;
- la **tabla de puntaje** por competencia (escala 0 a 5), con el dictamen de cada postulante;
- las **hojas de trabajo** de cada postulante, que al imprimir empiezan en página nueva.

![Generador de evaluaciones](https://raw.githubusercontent.com/FABIOR1981/documentacion-central/main/gestor_pruebas_llamados/documentacion/img/02_seleccion.png)

## Funcionalidades

| Pantalla | Para qué sirve |
|---|---|
| **Generador** (`index.html`) | Armar la evaluación, mostrar u ocultar la guía y el corrector, e imprimir en A4. |
| **Panel de Administración** (`admin.html`) | Núcleo del sistema: crear áreas y cargos, y **cargar a mano** las dinámicas de cada cargo (el código se genera solo según área y cargo; se puede duplicar una dinámica existente como base o crear varias seguidas). Incluye el **Asistente IA (opcional)**: lee las bases del llamado (`.docx`), anonimiza los datos sensibles y genera un *prompt* para que una IA proponga dinámicas. El archivo se procesa en el navegador y no se sube a ningún servidor. |

Catálogo actual en `FABIOR1981/bd/pruebas_llamados`: 4 áreas, 6 cargos y 25 dinámicas. El repositorio `bd` es la fuente de verdad; esta cifra puede cambiar cuando se actualicen esos JSON.

## Documentación

- 📘 [Manual de Usuario](https://github.com/FABIOR1981/documentacion-central/blob/main/gestor_pruebas_llamados/documentacion/MANUAL_USUARIO.md) ([PDF](https://github.com/FABIOR1981/documentacion-central/blob/main/gestor_pruebas_llamados/documentacion/Manual_de_Usuario.pdf)): uso de las pantallas, para evaluadores y administradores.
- 🧠 [Propuesta para profesionales de la Psicología](https://github.com/FABIOR1981/documentacion-central/blob/main/gestor_pruebas_llamados/documentacion/PROPUESTA_PSICOLOGOS.md) ([PDF](https://github.com/FABIOR1981/documentacion-central/blob/main/gestor_pruebas_llamados/documentacion/Propuesta_para_Psicologos.pdf)): presentación de la herramienta para psicólogos, con énfasis en la confidencialidad de las bases.
- 🛠️ [Manual Técnico](https://github.com/FABIOR1981/documentacion-central/blob/main/gestor_pruebas_llamados/documentacion/MANUAL_TECNICO.md) ([PDF](https://github.com/FABIOR1981/documentacion-central/blob/main/gestor_pruebas_llamados/documentacion/Manual_Tecnico.pdf)): funcionamiento, modelo de datos, instalación y mantenimiento.

## Ejecución local

El frontend es HTML, CSS y JavaScript sin paso de *build*. Para que funcione, también debe estar disponible la función de Netlify `/.netlify/functions/pruebas`: servir los archivos con un servidor HTTP estático no basta. Para desarrollo local, instala Node.js y ejecuta Netlify CLI desde la raíz del proyecto:

```bash
npx netlify dev
```

Abre la URL local que indique Netlify CLI. Para leer desde un repositorio `bd` privado, configura `GITHUB_TOKEN_PRUEBAS_LLAMADOS_BD` en el entorno local; para probar guardados, configura también `CLAVE_PRUEBAS`. No guardes secretos en el repositorio.

## Arquitectura para desarrollo

- `index.html` + `script.js` + `style.css`: generador de formularios e impresión. `script.js` obtiene el catálogo, filtra dinámicas por `cargo_id`, genera informes, hojas por postulante y puntajes.
- `admin.html` + `admin.js` + `admin.css`: gestión en memoria de áreas, cargos, competencias y dinámicas. Los cambios solo persisten al usar **Guardar en GitHub**.
- `bases_ia.js`: añade al panel el asistente opcional. Lee `.docx` en el navegador con Mammoth (cargado desde CDN), permite revisar el resumen y arma un *prompt*; no invoca un modelo ni guarda datos. La anonimización automática no garantiza eliminar todos los datos sensibles: hay que revisar el texto antes de usarlo.
- `utilidades.js`: funciones compartidas para escape HTML y composición de hojas y renglones de respuesta.
- `datos/datos.js`: única capa cliente de acceso a datos; expone `Datos.cargar()` y `Datos.guardar()` para la función Netlify.
- `netlify/functions/pruebas.js`: API del servidor. Lee y escribe los tres JSON en `FABIOR1981/bd`, ruta `pruebas_llamados`, rama `main`, mediante la API de GitHub.

Las páginas cargan los scripts clásicos en el orden indicado en su HTML y comparten estado mediante globales como `Datos` y `baseDatosGlobal`; conserva ese contrato si modificas módulos. No hay datos JSON de respaldo en este proyecto.

### Modelo de datos

La respuesta de la API combina tres archivos:

- `areas.json`: objeto indexado por sigla de área; cada entrada tiene `nombre`.
- `cargos.json`: objeto indexado por código `CAR-...`; cada cargo tiene `nombre`, `area` y `competencias` (cada competencia usa `comp`, `desc` y, opcionalmente, `codigo`).
- `dinamicas.json`: arreglo; cada dinámica relaciona su cargo mediante `cargo_id` y contiene `id`, `titulo`, `desc`, `tiempo_limite`, `hoja_postulante`, `caso_o_consigna`, `guia_evaluacion` y `respuesta_esperada`. `peso` y `renglones_hoja` son opcionales.

Las competencias definen las columnas de puntuación. La referencia opcional de sus códigos dentro de `caso_o_consigna` limita qué competencias aplican a cada dinámica; el cálculo final se normaliza sobre 30 puntos y considera `peso`.

El frontend estático debe desplegarse junto con la función en Netlify, o con otro servidor que implemente exactamente la ruta y el contrato de esa API. Publicar solo los archivos estáticos (por ejemplo, en GitHub Pages) no alcanza. No hay comando de *build*.

## Actualizar los datos

Los datos viven únicamente en el repositorio `FABIOR1981/bd`, carpeta `pruebas_llamados/` (`areas.json`, `cargos.json`, `dinamicas.json`). El navegador los lee y guarda mediante la función de Netlify `netlify/functions/pruebas.js`; no hay respaldo ni lectura/escritura de JSON locales en este proyecto. Si la función no está disponible, la app muestra el error y no carga datos locales.

Variables de entorno en Netlify:

| Variable | Uso |
|---|---|
| `GITHUB_TOKEN_PRUEBAS_LLAMADOS_BD` | Token válido con acceso al repositorio `bd`; se usa para leer repos privados y para guardar. |
| `CLAVE_PRUEBAS` | Contraseña que pide el panel para guardar. |

Si `bd` es público, la lectura puede funcionar sin token. Si es privado, Netlify debe tener configurado un `GITHUB_TOKEN_PRUEBAS_LLAMADOS_BD` válido con permiso de lectura; para guardar se requieren el token con permiso de escritura y `CLAVE_PRUEBAS`.

1. En el **Panel de Administración**, hacer los cambios.
2. Hacer clic en **Guardar en GitHub** e ingresar la contraseña. Si los archivos todavía no existen en `bd/pruebas_llamados/`, se crean en el primer guardado.

> Los cambios del panel quedan en memoria hasta guardar. Si se recarga la página antes, se pierden.

## Estructura

```
├── index.html / script.js / style.css   Generador e impresión
├── admin.html / admin.js / admin.css    Panel de Administración
├── bases_ia.js                          Asistente local que prepara prompts
├── utilidades.js                        Utilidades compartidas
├── datos/
│   └── datos.js                         Cliente de la API de Netlify
├── netlify/functions/pruebas.js         API para los JSON del repositorio bd
└── documentacion/LEEME.md               Enlace a manuales externos
```
