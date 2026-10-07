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

Catálogo incluido: 4 áreas, 5 cargos (Carga / Descarga, Administrativo, Encargado, Jefe y Contador) y 20 dinámicas.

## Documentación

- 📘 [Manual de Usuario](https://github.com/FABIOR1981/documentacion-central/blob/main/gestor_pruebas_llamados/documentacion/MANUAL_USUARIO.md) ([PDF](https://github.com/FABIOR1981/documentacion-central/blob/main/gestor_pruebas_llamados/documentacion/Manual_de_Usuario.pdf)): uso de las pantallas, para evaluadores y administradores.
- 🧠 [Propuesta para profesionales de la Psicología](https://github.com/FABIOR1981/documentacion-central/blob/main/gestor_pruebas_llamados/documentacion/PROPUESTA_PSICOLOGOS.md) ([PDF](https://github.com/FABIOR1981/documentacion-central/blob/main/gestor_pruebas_llamados/documentacion/Propuesta_para_Psicologos.pdf)): presentación de la herramienta para psicólogos, con énfasis en la confidencialidad de las bases.
- 🛠️ [Manual Técnico](https://github.com/FABIOR1981/documentacion-central/blob/main/gestor_pruebas_llamados/documentacion/MANUAL_TECNICO.md) ([PDF](https://github.com/FABIOR1981/documentacion-central/blob/main/gestor_pruebas_llamados/documentacion/Manual_Tecnico.pdf)): funcionamiento, modelo de datos, instalación y mantenimiento.

## Ejecución local

Es una aplicación estática (HTML, CSS y JavaScript, sin dependencias ni *build*). Hay que servirla por HTTP, porque los datos se cargan con `fetch()` y abrir `index.html` con doble clic da error.

```bash
python -m http.server 8080
# o bien
npx serve .
```

Después abrir:

- Generador: <http://localhost:8080>
- Panel de Administración: <http://localhost:8080/admin.html>

## Publicación

Se puede publicar en cualquier hosting estático (Netlify, GitHub Pages, Apache, Nginx, IIS). Se sube la carpeta raíz tal cual, sin comando de *build*.

## Actualizar los datos

Los datos viven únicamente en el repositorio `FABIOR1981/bd`, carpeta `pruebas_llamados/` (`areas.json`, `cargos.json`, `dinamicas.json`). El navegador los lee y guarda mediante la función de Netlify `netlify/functions/pruebas.js`; no hay respaldo ni lectura/escritura de JSON locales en este proyecto. Si la función no está disponible, la app muestra el error y no carga datos locales.

Variables de entorno en Netlify:

| Variable | Uso |
|---|---|
| `GITHUB_TOKEN_PRUEBAS` | Token con permiso de lectura y escritura de contenido sobre el repositorio `bd`. |
| `CLAVE_PRUEBAS` | Contraseña que pide el panel para guardar. |

1. En el **Panel de Administración**, hacer los cambios.
2. Hacer clic en **Guardar en GitHub** e ingresar la contraseña. Si los archivos todavía no existen en `bd/pruebas_llamados/`, se crean en el primer guardado.

> Los cambios del panel quedan en memoria hasta guardar. Si se recarga la página antes, se pierden.

## Estructura

```
├── index.html / script.js / style.css   Generador e impresión
├── admin.html / admin.js / admin.css    Panel de Administración
├── bases_ia.js                          Asistente "Directrices desde bases (IA)"
├── utilidades.js                        Utilidades (escape de HTML)
├── datos/
│   └── datos.js                         Acceso exclusivo a la función de Netlify
└── documentacion/LEEME.md               Aviso: los manuales están en documentacion-central
```
