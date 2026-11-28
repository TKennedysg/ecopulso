# ADR-01 · Núcleo de dominio puro ejecutado en el navegador

- **Estado:** aceptada · noviembre de 2026
- **Contexto / problema:** EcoPulso debe importar lecturas, validarlas, compararlas con una línea base y alertar, con reglas verificables por TDD (negativos, duplicados, unidad, línea base cero, faltantes). El equipo no tiene presupuesto para servidores y la demostración debe estar publicada en la nube.
- **Alternativas:**
  1. Backend con API y base de datos (por ejemplo, Node + PostgreSQL) y una interfaz web.
  2. Hoja de cálculo con fórmulas y macros.
  3. Un módulo JavaScript puro (`src/core.js`) que se ejecuta igual en el navegador y en Node, servido como sitio estático.
- **Decisión:** alternativa 3. Toda la lógica vive en `core.js`, sin dependencias; `index.html` solo pinta resultados; GitHub Pages publica `dist/`.
- **Consecuencias:**
  - (+) Las reglas se prueban con `node:test` sin navegador ni base de datos; el pipeline es rápido y el despliegue no tiene costo.
  - (+) La misma función produce el mismo resultado en la prueba y en la interfaz, lo que facilita la trazabilidad.
  - (−) No hay persistencia entre sesiones ni usuarios: los umbrales y lecturas se pierden al recargar. Si el proyecto lo necesita, el núcleo podrá reutilizarse detrás de una API.
  - (−) Los datos se procesan en el equipo del usuario; con archivos muy grandes el rendimiento depende del navegador (RNF-01 lo vigila).
