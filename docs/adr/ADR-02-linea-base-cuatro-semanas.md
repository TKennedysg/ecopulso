# ADR-02 · La línea base exige cuatro semanas previas (cambio HU-13)

- **Estado:** aceptada · noviembre de 2026 · reemplaza el comportamiento de la versión 1.1.1
- **Contexto / problema:** un laboratorio nuevo envía lecturas incompletas y solo tiene una o dos semanas de historial. En la versión 1.1.1 la línea base se calculaba con las semanas que hubiera, así que una semana normal podía compararse contra un promedio de una sola semana y generar una alerta poco confiable.
- **Alternativas:** (1) mantener el promedio con las semanas disponibles; (2) usar un valor de referencia fijo por tipo de espacio; (3) exigir cuatro semanas previas y mostrar «línea base en construcción (n/4 semanas)» sin alertas mientras tanto.
- **Decisión:** alternativa 3 (`SEMANAS_LINEA_BASE = 4` en `compararSemana`), junto con el aviso de días sin dato (`diasSinDato`) y el motivo «sin unidad» en la importación.
- **Consecuencias:** (+) no hay alertas falsas en espacios nuevos y el usuario ve cuánto falta para tener línea base; (−) un espacio nuevo no recibe alertas durante sus primeras cuatro semanas.
