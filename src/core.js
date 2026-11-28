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
export const UMBRAL_MIN = 5;
export const UMBRAL_MAX = 50;

/**
 * HU-08: configura el umbral de alerta de un espacio.
 * Devuelve el registro { espacio, umbral, autor, fecha } que se aplica desde el siguiente cálculo.
 * Rechaza valores fuera del rango permitido (5 % a 50 %) con un mensaje que lo indica.
 */
export function configurarUmbral(espacio, valor, autor, fecha = new Date()) {
  const nombreEspacio = String(espacio ?? '').trim();
  if (!nombreEspacio) throw new Error('Indique el espacio.');
  const umbral = Number(valor);
  if (!Number.isFinite(umbral)) throw new Error('El umbral debe ser un número.');
  if (umbral < UMBRAL_MIN || umbral > UMBRAL_MAX) {
    throw new Error(`El umbral debe estar entre ${UMBRAL_MIN} % y ${UMBRAL_MAX} %.`);
  }
  if (!autor || !String(autor).trim()) throw new Error('Indique quién registra el cambio.');
  return { espacio: nombreEspacio, umbral, autor: String(autor).trim(), fecha: fecha.toISOString() };
}

/**
 * HU-01 a HU-04: importa un CSV de lecturas.
 * Devuelve las lecturas aceptadas (normalizadas) y las filas rechazadas con su motivo.
 * Lanza un Error si falta una columna obligatoria (el archivo completo se rechaza).
 */
export function importarCSV(texto) {
  const filas = parseCSV(String(texto));
  if (filas.length === 0) throw new Error('El archivo está vacío.');
  const encabezado = filas[0].map((c) => c.trim().toLowerCase());
  for (const col of COLUMNAS) {
    if (!encabezado.includes(col)) throw new Error(`Falta la columna «${col}».`);
  }
  const idx = Object.fromEntries(COLUMNAS.map((c) => [c, encabezado.indexOf(c)]));
  const aceptadas = [];
  const rechazadas = [];
  const vistas = new Set();

  filas.slice(1).forEach((celdas, i) => {
    const fila = i + 2; // número de fila en el archivo (1 = encabezado)
    celdas = celdas.map((c) => c.trim());
    const espacio = celdas[idx.espacio];
    const fecha = celdas[idx.fecha];
    const tipo = (celdas[idx.tipo] || '').toLowerCase();
    const valorTxt = celdas[idx.valor];
    const unidadTxt = (celdas[idx.unidad] || '').toLowerCase();

    if (!espacio || !fechaValida(fecha)) {
      return rechazadas.push({ fila, motivo: 'espacio o fecha no válidos (use AAAA-MM-DD)' });
    }
    if (valorTxt === undefined || valorTxt === '' || !Number.isFinite(Number(valorTxt))) {
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

/** Parser CSV pequeño pero compatible con campos entre comillas y comillas escapadas (""). */
function parseCSV(texto) {
  const filas = [];
  let celdas = [];
  let celda = '';
  let entreComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const caracter = texto[i];
    if (caracter === '"') {
      if (entreComillas && texto[i + 1] === '"') {
        celda += '"';
        i++;
      } else {
        entreComillas = !entreComillas;
      }
    } else if (caracter === ',' && !entreComillas) {
      celdas.push(celda);
      celda = '';
    } else if (caracter === '\n' && !entreComillas) {
      celdas.push(celda.replace(/\r$/, ''));
      if (celdas.some((c) => c.trim() !== '')) filas.push(celdas);
      celdas = [];
      celda = '';
    } else {
      celda += caracter;
    }
  }

  if (entreComillas) throw new Error('CSV inválido: hay comillas sin cerrar.');
  if (celda !== '' || celdas.length > 0) {
    celdas.push(celda.replace(/\r$/, ''));
    if (celdas.some((c) => c.trim() !== '')) filas.push(celdas);
  }
  return filas;
}

/** true si el texto es una fecha real en formato AAAA-MM-DD (rechaza 2026-02-30 o 2026-99-99). */
export function fechaValida(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) return false;
  const d = new Date(`${fecha}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === fecha;
}

export const MAX_DIAS_SIN_DATO = 2; // HU-07: con más días sin lectura en la semana no se emite alerta

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
 * Si la semana actual tiene más de 2 días sin lectura, no se emite alerta: «datos insuficientes».
 */
export function compararSemana(lecturas, espacio, tipo = 'energia', umbral = UMBRAL_POR_DEFECTO) {
  const porSemana = new Map();
  const porDia = new Map();
  const diasPorSemana = new Map();
  let unidad = '';
  for (const l of lecturas) {
    if (l.espacio !== espacio || l.tipo !== tipo) continue;
    const s = inicioSemana(l.fecha);
    porSemana.set(s, (porSemana.get(s) || 0) + l.valor);
    if (!porDia.has(s)) porDia.set(s, new Map());
    const dias = porDia.get(s);
    dias.set(l.fecha, (dias.get(l.fecha) || 0) + l.valor);
    if (!diasPorSemana.has(s)) diasPorSemana.set(s, new Set());
    diasPorSemana.get(s).add(l.fecha);
    unidad = l.unidad;
  }
  const semanas = [...porSemana.keys()].sort();
  if (semanas.length === 0) return { espacio, estado: 'sin datos' };

  const actualSemana = semanas[semanas.length - 1];
  const actual = redondear(porSemana.get(actualSemana), 3);
  const previas = semanas.slice(-5, -1);
  const diasSinDato = 7 - diasPorSemana.get(actualSemana).size;
  const detalleDiario = Array.from({ length: 7 }, (_, i) => {
    const fecha = new Date(`${actualSemana}T00:00:00Z`);
    fecha.setUTCDate(fecha.getUTCDate() + i);
    const fechaTexto = fecha.toISOString().slice(0, 10);
    const valor = porDia.get(actualSemana).get(fechaTexto);
    return {
      fecha: fechaTexto,
      valor: valor === undefined ? null : redondear(valor, 3),
      unidad,
      estado: valor === undefined ? 'sin dato' : 'registrado',
    };
  });
  const base = { espacio, tipo, unidad, semana: actualSemana, actual, semanasBase: previas.length, diasSinDato, detalleDiario };

  if (previas.length === 0) {
    return { ...base, estado: 'línea base en construcción (0/4 semanas)', alerta: null };
  }
  const lineaBase = redondear(previas.reduce((a, s) => a + porSemana.get(s), 0) / previas.length, 3);
  if (lineaBase === 0) {
    return { ...base, lineaBase, estado: 'sin línea base comparable', alerta: null };
  }
  const variacion = redondear(((actual - lineaBase) / lineaBase) * 100, 1);
  if (diasSinDato > MAX_DIAS_SIN_DATO) {
    return { ...base, lineaBase, variacion, estado: `datos insuficientes (${diasSinDato} días sin dato)`, alerta: null };
  }
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
