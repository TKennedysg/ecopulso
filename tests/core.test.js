// Pruebas de aceptación de las historias del MVP (criterios del backlog).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importarCSV, compararSemana } from '../src/core.js';

const ENC = 'espacio,fecha,tipo,valor,unidad';

test('HU-01 · un CSV válido de 50 filas registra 50 lecturas', () => {
  const filas = [];
  for (let i = 0; i < 50; i++) {
    const d = new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10);
    filas.push(`Lab-1,${d},energia,10,kWh`);
  }
  const r = importarCSV([ENC, ...filas].join('\n'));
  assert.equal(r.aceptadas.length, 50);
  assert.equal(r.rechazadas.length, 0);
});

test('HU-01 · un CSV sin la columna «unidad» se rechaza completo', () => {
  assert.throws(() => importarCSV('espacio,fecha,tipo,valor\nLab-1,2026-11-02,energia,10'), /Falta la columna «unidad»/);
});

test('HU-02 · un consumo negativo se rechaza con su número de fila', () => {
  const r = importarCSV(`${ENC}\nLab-1,2026-11-02,energia,10,kWh\nLab-1,2026-11-03,energia,-5,kWh`);
  assert.deepEqual(r.rechazadas, [{ fila: 3, motivo: 'consumo negativo' }]);
  assert.equal(r.aceptadas.length, 1);
});

test('HU-02 · un valor no numérico se rechaza y el resto continúa', () => {
  const r = importarCSV(`${ENC}\nLab-1,2026-11-02,energia,abc,kWh\nLab-1,2026-11-03,energia,8,kWh`);
  assert.equal(r.rechazadas[0].motivo, 'valor no numérico');
  assert.equal(r.aceptadas.length, 1);
});

test('HU-03 · la segunda lectura con igual espacio, fecha y tipo se rechaza como duplicada', () => {
  const r = importarCSV(`${ENC}\nLab-1,2026-11-02,energia,10,kWh\nLab-1,2026-11-02,energia,11,kWh`);
  assert.deepEqual(r.rechazadas, [{ fila: 3, motivo: 'duplicada' }]);
});

test('HU-04 · 1500 Wh se guardan como 1,5 kWh', () => {
  const r = importarCSV(`${ENC}\nLab-1,2026-11-02,energia,1500,Wh`);
  assert.equal(r.aceptadas[0].valor, 1.5);
  assert.equal(r.aceptadas[0].unidad, 'kWh');
});

test('HU-04 · una unidad desconocida («kw») se rechaza', () => {
  const r = importarCSV(`${ENC}\nLab-1,2026-11-02,energia,10,kw`);
  assert.equal(r.rechazadas[0].motivo, 'unidad no válida');
});

function semanas(valores) {
  // Una lectura por semana (lunes), empezando el 2026-10-05.
  return valores.map((v, i) => {
    const d = new Date(Date.UTC(2026, 9, 5 + 7 * i)).toISOString().slice(0, 10);
    return { espacio: 'Lab-1', fecha: d, tipo: 'energia', valor: v, unidad: 'kWh' };
  });
}

test('HU-05 · base de 100 kWh y semana de 120 kWh da +20 %', () => {
  const r = compararSemana(semanas([100, 100, 100, 100, 120]), 'Lab-1');
  assert.equal(r.lineaBase, 100);
  assert.equal(r.variacion, 20);
});

test('HU-05 · una línea base igual a 0 no produce error de división', () => {
  const r = compararSemana(semanas([0, 0, 0, 0, 50]), 'Lab-1');
  assert.equal(r.estado, 'sin línea base comparable');
  assert.equal(r.alerta, null);
});

test('HU-07 · con umbral 15 % y semana a +20 % aparece la alerta con su regla', () => {
  const r = compararSemana(semanas([100, 100, 100, 100, 120]), 'Lab-1', 'energia', 15);
  assert.equal(r.alerta, 'Consumo 20 % sobre la línea base (regla: más de 15 %)');
});

test('HU-07 · con una semana a +10 % no se genera alerta', () => {
  const r = compararSemana(semanas([100, 100, 100, 100, 110]), 'Lab-1', 'energia', 15);
  assert.equal(r.alerta, null);
  assert.equal(r.estado, 'normal');
});
