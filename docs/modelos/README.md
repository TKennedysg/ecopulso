# Modelos de EcoPulso (Unidad 4)

Diagramas editables del recorrido de valor «importar lecturas → validar → comparar con la línea base → alerta → ajustar umbral».

| Vista | Archivo | Formato |
|---|---|---|
| UML · clases | `01_clases.mmd` | Mermaid |
| UML · secuencia (con excepción) | `02_secuencia.mmd` | Mermaid |
| UML · estados del monitoreo de un espacio | `03_estados.mmd` | Mermaid |
| BPMN · revisión semanal del consumo | `04_bpmn_revision_semanal.svg` | SVG (editable en draw.io o Inkscape) |
| C4 · nivel 1, contexto | `05_c4_contexto.svg` | SVG |
| C4 · nivel 2, contenedores | `06_c4_contenedores.svg` | SVG |
| C4 · nivel 3, componentes de la aplicación web | `07_c4_componentes.svg` | SVG |
| C4 · nivel 4, código (`src/core.js`) | `08_c4_codigo_core.mmd` | Mermaid |

## Versiones

- `v1/`: modelos antes del cambio de requisito HU-13 (versión 1.1.1 de la aplicación).
- `v2/`: modelos después de HU-13 «lecturas incompletas de un laboratorio nuevo» (versión 1.2.0).

Cambiaron clases (ResumenFaltantes), secuencia (detector de faltantes y línea base en construcción n/4), estados (bucle «previas < 4»), BPMN (aviso de días sin dato y condición de 4 semanas), componentes (Detector de faltantes; motivo «sin unidad») y código (`diasSinDato`, `SEMANAS_LINEA_BASE`). Contexto y contenedores no cambiaron.

Los archivos `.mmd` se ven directamente en GitHub o en https://mermaid.live. Las decisiones de arquitectura están en [`../adr/`](../adr/).
