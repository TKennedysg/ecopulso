// EcoPulso · núcleo de dominio (sin dependencias).
// Se usa igual en el navegador (web/app.js) y en Node (pruebas y servidor local).

export const COLUMNAS = ['espacio', 'fecha', 'tipo', 'valor', 'unidad'];

// Unidad recibida -> [unidad base, factor]
const UNIDADES = {
  wh: ['kWh', 0.001],
  kwh: ['kWh', 1],
  l: ['m3', 0.001],
  m3: ['m3', 1],
};

export const UMBRAL_POR_DEFECTO = 15; // % sobre la línea base

/**
 * HU-01 a HU-04: importa un CSV de lecturas.
 * Devuelve las lecturas aceptadas (normalizadas) y las filas rechazadas con su motivo.
 * Lanza un Error si falta una columna obligatoria (el archivo completo se rechaza).
 */
export function importarCSV(texto) {
  const lineas = String(texto).replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '');
  if (lineas.length === 0) throw new Error('El archivo está vacío.');
  const encabezado = lineas[0].split(',').map((c) => c.trim().toLowerCase());
  for (const col of COLUMNAS) {
    if (!encabezado.includes(col)) throw new Error(`Falta la columna «${col}».`);
  }
  const idx = Object.fromEntries(COLUMNAS.map((c) => [c, encabezado.indexOf(c)]));
  const aceptadas = [];
  const rechazadas = [];
  const vistas = new Set();

  lineas.slice(1).forEach((linea, i) => {
    const fila = i + 2; // número de fila en el archivo (1 = encabezado)
    const celdas = linea.split(',').map((c) => c.trim());
    const espacio = celdas[idx.espacio];
    const fecha = celdas[idx.fecha];
    const tipo = (celdas[idx.tipo] || '').toLowerCase();
    const valorTxt = celdas[idx.valor];
    const unidadTxt = (celdas[idx.unidad] || '').toLowerCase();

    if (!espacio || !/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) {
      return rechazadas.push({ fila, motivo: 'espacio o fecha no válidos (use AAAA-MM-DD)' });
    }
    if (valorTxt === undefined || valorTxt === '' || Number.isNaN(Number(valorTxt))) {
      return rechazadas.push({ fila, motivo: 'valor no numérico' });
    }
    const valor = Number(valorTxt);
    if (valor < 0) return rechazadas.push({ fila, motivo: 'consumo negativo' });
    if (!UNIDADES[unidadTxt]) return rechazadas.push({ fila, motivo: 'unidad no válida' });

    const clave = `${espacio}|${fecha}|${tipo}`;
    if (vistas.has(clave)) return rechazadas.push({ fila, motivo: 'duplicada' });
    vistas.add(clave);

    const [unidad, factor] = UNIDADES[unidadTxt];
    aceptadas.push({ espacio, fecha, tipo, valor: redondear(valor * factor, 6), unidad });
  });

  return { aceptadas, rechazadas };
}

/** Lunes (AAAA-MM-DD) de la semana ISO de una fecha. */
export function inicioSemana(fecha) {
  const d = new Date(`${fecha}T00:00:00Z`);
  const dia = (d.getUTCDay() + 6) % 7; // 0 = lunes
  d.setUTCDate(d.getUTCDate() - dia);
  return d.toISOString().slice(0, 10);
}

/**
 * HU-05 y HU-07: compara la última semana de un espacio con su línea base
 * (promedio de las 4 semanas anteriores con datos) y decide si hay alerta.
 */
export function compararSemana(lecturas, espacio, tipo = 'energia', umbral = UMBRAL_POR_DEFECTO) {
  const porSemana = new Map();
  let unidad = '';
  for (const l of lecturas) {
    if (l.espacio !== espacio || l.tipo !== tipo) continue;
    const s = inicioSemana(l.fecha);
    porSemana.set(s, (porSemana.get(s) || 0) + l.valor);
    unidad = l.unidad;
  }
  const semanas = [...porSemana.keys()].sort();
  if (semanas.length === 0) return { espacio, estado: 'sin datos' };

  const actualSemana = semanas[semanas.length - 1];
  const actual = redondear(porSemana.get(actualSemana), 3);
  const previas = semanas.slice(-5, -1);
  const base = { espacio, tipo, unidad, semana: actualSemana, actual, semanasBase: previas.length };

  if (previas.length === 0) {
    return { ...base, estado: 'línea base en construcción (0/4 semanas)', alerta: null };
  }
  const lineaBase = redondear(previas.reduce((a, s) => a + porSemana.get(s), 0) / previas.length, 3);
  if (lineaBase === 0) {
    return { ...base, lineaBase, estado: 'sin línea base comparable', alerta: null };
  }
  const variacion = redondear(((actual - lineaBase) / lineaBase) * 100, 1);
  const alerta = variacion > umbral
    ? `Consumo ${variacion} % sobre la línea base (regla: más de ${umbral} %)`
    : null;
  return { ...base, lineaBase, variacion, estado: alerta ? 'alerta' : 'normal', alerta };
}

export function espacios(lecturas) {
  return [...new Set(lecturas.map((l) => l.espacio))].sort();
}

function redondear(n, d) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}
