# Propuesta para profesionales de la Psicología

**Gestor de Pruebas para Llamados**

Versión para imprimir: [Propuesta_para_Psicologos.pdf](Propuesta_para_Psicologos.pdf)

---

## 1. La propuesta en pocas palabras

En un llamado, buena parte del tiempo del psicólogo no se dedica a evaluar. Se va en **preparar el material**: elegir ejercicios adecuados al cargo, redactar consignas, armar planillas de puntaje y fotocopiar hojas para cada postulante. Además, cuando hay muchos candidatos, varios evaluadores o llamados sucesivos, cuesta mantener **los mismos criterios** para todos.

El *Gestor de Pruebas para Llamados* se encarga de esa preparación. En pocos minutos genera, listo para imprimir:

- un **informe para el evaluador**, con cada dinámica explicada, su tiempo, qué observar y la respuesta esperada;
- una **tabla de puntaje por competencias** para cada postulante;
- las **hojas de trabajo** de cada candidato, con consigna y espacio para responder.

> **La idea central:** la herramienta prepara y ordena el material. **La observación, la interpretación y el dictamen siguen siendo del profesional.**

> **Confidencialidad garantizada por diseño:** cuando se usan las bases de un llamado para crear dinámicas nuevas, el texto que se lleva a la inteligencia artificial **no deja rastro de la empresa que redactó las bases, ni de sus clientes, ni de personas concretas.** Se explica en detalle en la sección 6.

![Armado de una evaluación: cargo, cantidad de postulantes y dinámicas](img/02_seleccion.png)

---

## 2. Desafíos habituales en la evaluación de un llamado

| Desafío | Qué suele pasar |
|---|---|
| **Tiempo de preparación** | Cada llamado obliga a buscar o redactar ejercicios, consignas y planillas casi desde cero. |
| **Consistencia entre postulantes** | Si las consignas, los tiempos o los criterios varían, la comparación entre candidatos pierde solidez. |
| **Varios evaluadores** | Sin una guía común, cada evaluador puede valorar distinto la misma conducta. |
| **Registro y fundamentación** | El dictamen tiene que poder justificarse con evidencia ordenada y trazable. |
| **Adecuación al perfil** | Las pruebas tienen que relacionarse con las tareas y competencias reales del cargo que se describen en las bases. |
| **Confidencialidad** | Las bases y los datos del proceso no deberían circular sin cuidado. |

---

## 3. Qué aporta la herramienta

### 3.1 Evaluaciones armadas en minutos

El profesional elige el **cargo**, indica cuántos **postulantes** va a evaluar (hasta 10 por tanda) y marca las **dinámicas** que quiere aplicar. La herramienta muestra solo las dinámicas del cargo elegido y calcula el **tiempo total estimado** de la sesión, lo que ayuda a planificar la jornada.

Con un clic se genera todo el material, ordenado e identificado con un código único por prueba. Así queda claro qué se aplicó a cada candidato.

### 3.2 Dinámicas situacionales ligadas al cargo

Cada cargo tiene sus propias dinámicas: ejercicios prácticos que reproducen situaciones del puesto. La versión actual incluye **20 dinámicas** para **5 cargos** (Carga / Descarga, Administrativo, Encargado, Jefe y Contador), y se pueden agregar las que el profesional necesite.

Cada dinámica trae:

- **descripción y objetivo** (qué se quiere observar);
- **tiempo límite**;
- **consigna para el postulante**;
- **guía de observación**, con indicadores de *Éxito* y de *Alerta*;
- **respuesta esperada**, incluyendo las "trampas" previstas.

*Ejemplo (cargo Carga / Descarga):* en la "Prueba de Atención Sostenida y Verificación de Códigos", el postulante tiene 2 minutos para marcar en un listado los códigos que cumplen una regla. La guía indica que el **éxito** es una alta tasa de aciertos con pocos falsos positivos. La **alerta** es marcar de forma desordenada, omitir más de la mitad o bloquearse ante la presión. El corrector lista los 6 códigos correctos y explica las trampas.

![Informe para el evaluador: guía de observación y respuesta esperada](img/03_informe_dinamicas.png)

### 3.3 Puntaje por competencias, comparable entre candidatos

Cada cargo tiene definidas sus **competencias**. Por ejemplo, para *Jefe*: Visión Estratégica, Negociación e Influencia y Gestión de Crisis. Para cada postulante se genera una matriz:

- cada **fila** es una dinámica y cada **columna** una competencia, puntuada **de 0 a 5**;
- se calculan los totales por dinámica, por competencia y el total general;
- hay un espacio para **observaciones y notas de conducta**;
- el informe cierra con el **dictamen global**: *Apto / Apto con reservas / No apto*.

Así, todos los candidatos se evalúan sobre las mismas competencias, con la misma escala y en el mismo formato. Eso facilita compararlos y fundamentar la decisión.

![Tabla de puntaje por competencias de un postulante](img/04_tabla_puntaje.png)

### 3.4 Material del postulante listo para entregar

Cada postulante recibe su hoja por dinámica, con nombre, fecha, código de la prueba, tiempo límite, consigna y renglones para responder. Al imprimir, cada hoja sale en una página aparte (formato A4) y también se puede guardar en PDF.

El interruptor **Guía y corrector** permite imprimir el informe **sin las respuestas esperadas** cuando el material puede quedar a la vista de otras personas.

![Hoja de trabajo del postulante](img/05_hoja_postulante.png)

---

## 4. El criterio profesional, en el centro

La herramienta **no reemplaza al psicólogo ni emite diagnósticos**. Su función es estructurar el proceso:

- **El profesional decide** qué cargo, qué dinámicas y qué competencias se evalúan.
- **El profesional observa y puntúa.** La guía de observación orienta, pero la valoración es suya.
- **El profesional dictamina.** El dictamen global se completa a mano, con sus fundamentos.
- **El profesional adapta.** Puede crear, modificar o eliminar dinámicas y definir cargos nuevos desde el Panel de Administración.

> **Aclaración:** las dinámicas son **ejercicios situacionales** pensados para observar competencias en relación con el cargo. **No son tests psicométricos estandarizados.** Pueden **complementar** los instrumentos que el profesional ya utiliza y que tienen sus propias normas de aplicación e interpretación.

---

## 5. Adaptar la evaluación a cada llamado

### 5.1 A partir de las bases del llamado

El asistente **Directrices desde bases (IA)** lee el archivo Word de las bases. Detecta el cargo, el área, las competencias y las tareas del puesto, y prepara un texto (*prompt*) para pedirle a una inteligencia artificial que proponga **dinámicas nuevas alineadas a ese perfil**.

Las propuestas de la IA son un **borrador**: el profesional las revisa, ajusta o descarta antes de incorporarlas.

![Asistente: datos detectados en las bases, editables antes de generar el prompt](img/06b_bases_ia_paso2.png)

### 5.2 Banco de dinámicas propio

Desde el **Panel de Administración**, el equipo puede construir y mantener su propio banco de dinámicas por área y cargo, con su guía de observación y su corrector. La experiencia de cada llamado se acumula y queda disponible para los siguientes.

![Panel de Administración: dinámicas de un cargo](img/07_admin.png)

<div style="break-before:page"></div>

## 6. Confidencialidad: las bases no dejan rastro

Las bases de un llamado suelen contener información sensible: el nombre de la organización o de la consultora que las redactó, sus clientes, responsables, números de llamado, fechas, remuneraciones y datos de contacto. El asistente está diseñado para que **nada de eso llegue a la inteligencia artificial**. Lo que se obtiene es un pedido **genérico**, que describe un perfil de puesto pero no permite saber de qué empresa, cliente o llamado proviene.

> **En resumen:** el archivo de bases **nunca sale de la computadora**, el texto completo **nunca se incluye** en el pedido a la IA, los datos identificatorios **se reemplazan automáticamente** y el profesional **revisa todo** antes de copiarlo. Las dinámicas que se crean a partir de ese pedido **no contienen referencias** a la empresa que diseñó las bases ni a sus clientes.

### 6.1 Cinco capas de protección

1. **El archivo no se sube a ningún lado.** El documento Word se lee dentro del propio navegador del profesional. La herramienta no tiene servidor que lo reciba, no lo guarda y, al cerrar la ventana, no queda copia.
2. **Del documento solo se toma lo indispensable.** El pedido a la IA **no contiene el texto de las bases**. Contiene únicamente cuatro datos del perfil: el **nombre del cargo**, el **área**, las **competencias** elegidas de una lista estándar y **hasta 12 tareas típicas** del puesto. Todo lo demás (antecedentes de la organización, condiciones, cronograma, requisitos administrativos, firmas) queda afuera.
3. **Los datos identificatorios se borran solos.** En los datos que sí se usan, la herramienta reemplaza automáticamente:
    - correos electrónicos → `[EMAIL]`;
    - números de documento de identidad → `[DOC]`;
    - fechas → `[FECHA]`;
    - montos en pesos o dólares → `[MONTO]`;
    - números de llamado, concurso o licitación → `[LLAMADO]`.
4. **Nombres de empresa, clientes y sectores, ocultos.** En el campo **Términos a enmascarar** se escriben, separados por coma, los nombres que no deben aparecer: la organización, la consultora, los clientes, marcas, sectores o personas. Cada uno se reemplaza por `[X]` en todo el texto, sin importar mayúsculas o minúsculas.
5. **El profesional tiene la última palabra.** Antes de generar el pedido, el cargo, el área y las tareas se muestran en campos **editables**, para corregir o borrar lo que quiera. El pedido final también se muestra completo y **no se envía automáticamente**: solo llega a la IA si el profesional lo copia y lo pega. Además, el propio pedido le indica a la IA que diseñe las dinámicas **"sin nombres reales ni datos de organismos"**.

### 6.2 Qué llega a la IA y qué no

| Llega a la IA (ya anonimizado) | No llega nunca |
|---|---|
| Nombre genérico del cargo (p. ej. "Tesorero") | El archivo de bases y su texto completo |
| Área (p. ej. "Finanzas") | Nombre de la empresa o consultora que diseñó las bases |
| Competencias elegidas de una lista estándar | Nombres de clientes, marcas o personas |
| Hasta 12 tareas típicas del puesto, redactadas en forma genérica | Correos, documentos, fechas, montos y números de llamado |
| Títulos de las dinámicas que ya existen para ese cargo, para no repetirlas | Datos de los postulantes (la herramienta no los registra) |

*Ejemplo:* si las bases dicen *"Consultora Andina S.A., por cuenta de su cliente Banco Delta, convoca al Llamado N° 12/2026 para Tesorero; consultas a rrhh@andina.com hasta el 15/11/2026"*, y el profesional escribe en Términos a enmascarar *"Consultora Andina, Banco Delta"*, al pedido a la IA solo llega el cargo **"Tesorero"**, el área, las competencias y las tareas genéricas. Si algún dato hubiera quedado dentro de una tarea, se vería como *"[X] … [LLAMADO] … [EMAIL] … [FECHA]"*.

### 6.3 Buena práctica recomendada

Las fechas, montos, correos, documentos y números de llamado se ocultan solos. **Los nombres propios dependen de que se indiquen en "Términos a enmascarar"**, porque cada organización y cada cliente se llaman distinto. Por eso se recomienda:

- escribir siempre en ese campo el nombre de la organización, de la consultora y de los clientes, incluidas siglas y variantes;
- dar una lectura rápida al pedido final antes de copiarlo (lleva menos de un minuto).

Con esos dos hábitos, el pedido que se lleva a la IA describe un puesto de trabajo y **nada más**.

![Pedido final para la IA, visible y revisable antes de copiarlo](img/06c_bases_ia_prompt.png)

<div style="break-before:page"></div>

## 7. Beneficios resumidos

| Para el profesional | Para la organización | Para el postulante |
|---|---|---|
| Menos tiempo de preparación y más tiempo para observar y analizar. | Procesos de selección más ordenados y documentados. | Mismas consignas, mismos tiempos y mismos criterios para todos. |
| Guías de observación y correctores a mano durante la aplicación. | Criterios homogéneos aunque intervengan varios evaluadores. | Evaluación vinculada a tareas reales del cargo. |
| Puntaje por competencias que ayuda a fundamentar el dictamen. | Banco de pruebas reutilizable y adaptable a cada llamado. | Material claro e impreso, con instrucciones precisas. |
| Puede crear dinámicas nuevas con IA sin exponer las bases ni a sus clientes. | La información de la empresa y de sus clientes no sale de la organización. | Confidencialidad: no se registran sus datos en el sistema. |
| Control total: puede crear y ajustar las dinámicas. | No requiere instalación ni licencias: funciona en el navegador. | Trato equitativo y documentado. |

## 8. Cómo empezar

1. **Recorrido de 15 minutos:** abrir la herramienta, elegir un cargo y generar una evaluación de ejemplo. El **Manual de Usuario** explica cada pantalla.
2. **Revisión del banco:** analizar las dinámicas, guías y competencias del cargo de interés y ajustar lo necesario según el criterio profesional.
3. **Prueba piloto:** usarla en el próximo llamado junto con la metodología habitual y comparar tiempos de preparación, claridad del registro y facilidad para fundamentar el dictamen.
