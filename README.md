# EcoPulso · Observatorio de consumo y retos sostenibles

Proyecto 5 de la práctica **Kanban–XP** · Modelado Ágil de Software (IS-505) · ULEAM · 2026-2
Equipo: Santiago Joel Álvarez Mendoza · Alejandro Emilio Cedeño Zambrano · Tyrone Alan Anchundia

> Todos los datos de consumo son **simulados**. El sistema no usa sensores ni afirma ahorros reales.

[![CI/CD EcoPulso](https://github.com/TKennedysg/ecopulso/actions/workflows/ci.yml/badge.svg)](https://github.com/TKennedysg/ecopulso/actions/workflows/ci.yml)

- **Aplicación desplegada (GitHub Pages):** https://tkennedysg.github.io/ecopulso/
- **Tablero Kanban (Trello):** https://trello.com/b/fIEa984c/ecopulso-tablero-kanban-proyecto-5
- **Backlog:** [`docs/backlog.csv`](docs/backlog.csv) y los *issues* HU-01 a HU-13 de este repositorio.

## Funcionalidad verificable

Importación de lecturas por CSV con validación y alerta explicada:

| Historia | Qué hace | Prueba automatizada |
|---|---|---|
| HU-01 | Importa un CSV `espacio,fecha,tipo,valor,unidad`; rechaza el archivo si falta una columna | `tests/core.test.js` |
| HU-02 | Rechaza consumos negativos y valores no numéricos, con número de fila | `tests/core.test.js` |
| HU-03 | Rechaza lecturas duplicadas (mismo espacio, fecha y tipo) | `tests/core.test.js` |
| HU-04 | Normaliza Wh → kWh y L → m³; rechaza unidades desconocidas | `tests/core.test.js` |
| HU-05 | Compara la última semana con la línea base (promedio de 4 semanas); base 0 sin error | `tests/core.test.js` |
| HU-07 | Emite una alerta con la regla aplicada si la variación supera el umbral (15 %); con más de 2 días sin dato en la semana no alerta e indica «datos insuficientes» | `tests/core.test.js`, `tests/validaciones.test.js` |
| HU-08 | Umbral configurable por espacio entre 5 % y 50 %, registrado con fecha y autor | `tests/umbral.test.js` |

## Requisitos de ejecución

- **Node.js 20 o superior** (probado con Node 22). No hay dependencias externas: `npm ci` solo verifica el lockfile.
- Opcional: **Docker** y Docker Compose para el entorno local reproducible.

```bash
npm ci            # instalar dependencias (lockfile)
npm test          # pruebas (node:test)
npm run build     # genera dist/ con versión, commit y fecha
npm start         # construye dist/ y abre el servidor local en http://localhost:8080
```

Con Docker:

```bash
cp .env.example .env      # poner un token propio en ECOPULSO_ADMIN_TOKEN
docker compose up --build # http://localhost:8080 · salud en /api/health
```

## Limitaciones conocidas (pendientes del backlog)

- **HU-06** (distinguir días sin lectura de consumo 0 en el panel) aún no está implementada.
- Los duplicados se detectan dentro de un mismo archivo; no hay persistencia entre importaciones.
- El lector CSV separa por comas y no admite campos entre comillas.
- Una semana cuenta 7 días: con lecturas de lunes a viernes hay 2 días sin dato y la alerta sí se evalúa.

## Estrategia de ramas

- `main`: versión estable. Cada *push* a `main` se prueba, se construye y se despliega en GitHub Pages.
- `feature/HU-xx-descripcion`: una rama por historia. Se integra a `main` solo mediante *pull request* con las pruebas en verde y la revisión de al menos un compañero.
- Etiquetas `vX.Y.Z`: marcan cada versión desplegada y sirven para volver a una versión estable.

## Integración y despliegue continuos

El workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) se ejecuta en cada *push* y en cada *pull request* hacia `main`:

1. **Obtener el código** y **preparar Node.js 22**.
2. **Instalar dependencias** con `npm ci`.
3. **Ejecutar pruebas** (`npm test`). El token de administración llega como secreto del repositorio (`ECOPULSO_ADMIN_TOKEN`); su valor nunca aparece en el código ni en los registros.
4. **Construir** `dist/` con la versión y el commit.
5. Solo en `main`: **desplegar en GitHub Pages** y ejecutar una **prueba de humo** sobre el sitio publicado (`version.json`, página principal y CSV de ejemplo).

## Secretos

- `ECOPULSO_ADMIN_TOKEN`: protege la ruta `/api/admin/info` del servidor local. En GitHub se guarda en *Settings → Secrets and variables → Actions*; en local, en el archivo `.env` (excluido por `.gitignore`).
- El sitio de GitHub Pages es estático y no contiene secretos.

## Volver a una versión estable (rollback)

1. En **Actions → CI/CD EcoPulso → Run workflow**, escribir la etiqueta estable (por ejemplo `v1.0.0`) en «Versión a desplegar» y ejecutar. El pipeline prueba, construye y despliega esa versión.
2. Comprobar en el pie de la aplicación o en `/version.json` que la versión publicada es la esperada.
3. Corregir el problema en una rama `feature/…` y volver a integrarlo con un *pull request*.

En local: `git checkout v1.0.0 && docker compose up --build`.

## Registros

- **CI/CD:** pestaña *Actions* (cada paso con su salida) y *Deployments → github-pages* (historial de versiones publicadas).
- **Servidor local:** cada petición se registra en la consola con fecha, método, ruta y código (`docker compose logs ecopulso`).
