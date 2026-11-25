# EcoPulso · Observatorio de consumo y retos sostenibles

Proyecto 5 de la práctica **Kanban–XP** · Modelado Ágil de Software (IS-505) · ULEAM · 2026-2

> Todos los datos de consumo son **simulados**. El sistema no usa sensores ni afirma ahorros reales.

## Visión

EcoPulso es un observatorio web de consumo para aulas y laboratorios universitarios que trabaja con datos simulados. Sus usuarios son el **responsable de espacio** y la **comunidad estudiantil**. Reúne las lecturas, rechaza los datos inválidos explicando el motivo, las compara con una línea base explícita y emite alertas que muestran la regla aplicada, para que cada alerta pueda convertirse en una acción o en un reto de ahorro.

**Hipótesis:** si el responsable de un espacio ve su consumo semanal frente a la línea base junto con una alerta explicada, podrá proponer al menos una acción de ahorro concreta en menos de cinco minutos (se valida con 3 usuarios simulados; se confirma si al menos 2 de 3 lo logran).

## Tablero y backlog

- **Tablero Kanban:** https://github.com/users/TKennedysg/projects/1/views/1
- **Backlog editable (tabla con prioridad e incremento):** https://github.com/users/TKennedysg/projects/1/views/2?visibleFields=%5B%22Title%22%2C%22Status%22%2C%22Labels%22%2C%22Milestone%22%5D
- **Backlog en CSV:** [`docs/backlog.csv`](docs/backlog.csv) (se abre en Excel o Google Sheets).
- Cada historia es un *issue*: la etiqueta indica la prioridad MoSCoW y los puntos; el *milestone*, el incremento.

## Roadmap (después del cambio)

| Incremento | Historias | Resultado esperado | Evidencia de aceptación |
|---|---|---|---|
| 1 · MVP | HU-01, 02, 03, 04, 05, 07 (24 pts) | Importar CSV, ver rechazos explicados, comparar con la línea base y recibir una alerta | Pruebas TDD en verde (negativo, duplicado, unidad, línea base cero) y demo «importación → alerta» |
| 2 | HU-06, 13, 08, 09 (14 pts) + RNF-01 | Faltante ≠ cero, importación parcial de un laboratorio nuevo, umbral por espacio y acción de ahorro | Prueba «faltante ≠ cero», 5 000 filas en < 5 s, comparación antes/después |
| 3 | HU-10, 12 (7 pts) + validación | Retos de ahorro e ingreso manual; validación de la hipótesis | Demo completa y resultado con 3 usuarios simulados |

## Product Backlog

| ID | Historia | Criterios de aceptación | Pts | Prioridad | Depende de | Inc. |
|---|---|---|---|---|---|---|
| HU-01 | **Importar lecturas por CSV**<br>Como responsable de espacio, quiero importar un archivo CSV con lecturas (espacio, fecha, tipo, valor y unidad), para no digitar las lecturas una por una. | • Dado un CSV válido de 50 filas, cuando lo importo, entonces se registran 50 lecturas y veo un resumen de la carga.<br>• Dado un CSV sin la columna «unidad», cuando lo importo, entonces el archivo se rechaza indicando la columna faltante. | 5 | Must | — | 1 (MVP) |
| HU-02 | **Rechazar valores inválidos**<br>Como responsable de espacio, quiero que se rechacen los consumos negativos o no numéricos, para que el panel no muestre datos falsos. | • Dada una fila con valor −5, cuando se importa, entonces se rechaza con el motivo «consumo negativo» y su número de fila.<br>• Dada una fila con valor «abc», cuando se importa, entonces se rechaza como «valor no numérico» y el resto del archivo continúa. | 2 | Must | HU-01 | 1 (MVP) |
| HU-03 | **Detectar registros duplicados**<br>Como responsable de espacio, quiero que el sistema detecte lecturas repetidas, para no contar dos veces el mismo consumo. | • Dadas dos filas con el mismo espacio, fecha y tipo, cuando se importan, entonces la segunda se rechaza como «duplicada».<br>• Dado un archivo ya importado, cuando lo vuelvo a importar, entonces no se crea ninguna lectura nueva. | 5 | Must | HU-01 | 1 (MVP) |
| HU-04 | **Normalizar unidades**<br>Como responsable de espacio, quiero que las lecturas en Wh y kWh (o L y m³) se conviertan a una unidad común, para comparar consumos de forma correcta. | • Dada una lectura de 1500 Wh, cuando se registra, entonces se guarda como 1,5 kWh.<br>• Dada una unidad desconocida («kw»), cuando se importa, entonces la fila se rechaza como «unidad no válida». | 2 | Must | HU-01 | 1 (MVP) |
| HU-05 | **Comparar la semana con la línea base**<br>Como responsable de espacio, quiero ver el consumo de la semana frente a una línea base explícita, para saber si mi espacio consume más de lo normal. | • Dada una línea base de 100 kWh (promedio de las 4 semanas previas) y una semana de 120 kWh, cuando abro el panel, entonces veo +20 % y cómo se calculó la base.<br>• Dada una línea base igual a 0, cuando abro el panel, entonces veo «sin línea base comparable» y no se produce ningún error de división. | 5 | Must | HU-02, HU-03, HU-04 | 1 (MVP) |
| HU-06 | **Distinguir datos faltantes de consumo cero**<br>Como responsable de espacio, quiero que los días sin lectura aparezcan como «sin dato» y no como 0, para no subestimar el consumo ni la línea base. | • Dado un día sin lectura, cuando veo el panel, entonces aparece como «sin dato» y no entra en el promedio.<br>• Dado un día con lectura 0, cuando veo el panel, entonces aparece como 0 kWh y sí entra en el promedio. | 3 | Must | HU-05 | 2 |
| HU-07 | **Alerta por umbral con regla explicada**<br>Como responsable de espacio, quiero recibir una alerta cuando el consumo supere el umbral, con la regla aplicada, para entender por qué se generó y actuar. | • Dado un umbral de +15 % y una semana a +20 %, cuando se calcula, entonces aparece la alerta «20 % sobre la línea base (regla: más de 15 %)».<br>• Dada una semana a +10 %, cuando se calcula, entonces no se genera alerta.<br>• Dada una semana con más de 2 días sin dato, cuando se calcula, entonces no se emite alerta y se indica «datos insuficientes». | 5 | Must | HU-05 | 1 (MVP) |
| HU-08 | **Configurar el umbral por espacio**<br>Como responsable de espacio, quiero ajustar el umbral de alerta de mi espacio, para adaptarlo a su uso real. | • Dado un umbral entre 5 % y 50 %, cuando lo guardo, entonces se aplica desde el siguiente cálculo y queda registrado con fecha y autor.<br>• Dado un umbral fuera de ese rango, cuando lo guardo, entonces se rechaza con un mensaje que indica el rango permitido. | 3 | Should | HU-07 | 2 |
| HU-09 | **Registrar una acción de ahorro**<br>Como responsable de espacio, quiero registrar una acción de ahorro vinculada a una alerta, para comparar el consumo antes y después de aplicarla. | • Dada una alerta activa, cuando registro la acción «apagar equipos al cierre», entonces queda guardada con fecha, espacio y alerta asociada.<br>• Dada una acción registrada, cuando veo el panel, entonces la semana de la acción aparece marcada y se muestra la diferencia con la semana anterior. | 3 | Should | HU-07 | 2 |
| HU-10 | **Crear un reto de ahorro**<br>Como responsable de espacio, quiero crear un reto con meta porcentual y duración, para motivar a la comunidad del laboratorio. | • Dada una meta de −10 % durante 4 semanas, cuando creo el reto, entonces se muestra activo con su meta y fechas.<br>• Dada una meta positiva o igual a 0, cuando creo el reto, entonces se rechaza. | 5 | Could | HU-05, HU-09 | 3 |
| HU-11 | **Ver retos y su progreso**<br>Como estudiante del espacio, quiero ver los retos activos de mi laboratorio y su progreso semanal, para participar y saber si vamos cumpliendo. | • Dado un reto activo, cuando lo abro, entonces veo el progreso calculado con la misma línea base del panel.<br>• Dada una semana con datos insuficientes, cuando veo el reto, entonces el progreso indica «sin datos suficientes» en lugar de un porcentaje. | 3 | Won't | HU-10 | — |
| HU-12 | **Ingresar una lectura manualmente**<br>Como responsable de espacio, quiero registrar una lectura desde un formulario, para cargar datos de espacios que no tienen CSV. | • Dada una lectura válida, cuando la guardo, entonces aparece en el panel con su unidad normalizada.<br>• Dada una lectura negativa o duplicada, cuando la guardo, entonces se rechaza con el mismo motivo que en la importación. | 2 | Should | HU-02, HU-03, HU-04 | 3 |
| HU-13 | **Importación parcial de un espacio nuevo**<br>Como responsable del nuevo laboratorio, quiero importar lecturas incompletas y que se acepten las filas válidas mientras se reportan las rechazadas y los días faltantes, para no perder toda la carga. | • Dado un CSV de 10 filas con 2 filas sin unidad y 3 días sin lectura, cuando lo importo, entonces veo «8 aceptadas, 2 rechazadas (sin unidad), 3 días sin dato».<br>• Dado un espacio con menos de 4 semanas de datos, cuando abro el panel, entonces veo «línea base en construcción (n/4 semanas)» y no se emiten alertas. | 5 | Must | HU-01, HU-06 | 2 |

### Requisitos no funcionales

| ID | Requisito | Comprobación |
|---|---|---|
| RNF-01 | **Rendimiento de la importación**: Un CSV de 5 000 lecturas se importa y valida en menos de 5 segundos. | Prueba automatizada con un archivo generado de 5 000 filas que mide el tiempo; se ejecuta en cada integración. |
| RNF-02 | **Transparencia de los datos**: Toda cifra del panel muestra unidad y periodo; toda alerta muestra su regla; las pantallas llevan la etiqueta «datos simulados» y no hay afirmaciones de ahorro real. | Lista de verificación revisada en cada Sprint Review y prueba de interfaz que busca la etiqueta y la unidad en el panel. |

## Cambio gestionado

Al cerrar el Incremento 1 se incorpora el **Laboratorio de Redes**, que envía lecturas incompletas. Se agregó **HU-13** (Must), **HU-06** subió de Should a Must, **HU-12** pasó al Incremento 3 y **HU-11** quedó como Won’t en esta entrega.

## Integrantes

- [Integrante 1]
- [Integrante 2]
- [Integrante 3]
