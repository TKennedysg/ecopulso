// Cambio de requisito HU-13 · lecturas incompletas de un laboratorio nuevo (issue #13).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../src/core.js';

const ENC = 'espacio,fecha,tipo,valor,unidad';

test('HU-13 · un CSV de 10 filas con 2 sin unidad y 3 días sin lectura informa 8 aceptadas, 2 rechazadas y 3 días sin dato', () => {
  const filas = [
    'Lab-Nuevo,2026-11-16,energia,20,kWh', 'Lab-Nuevo,2026-11-17,energia,21,kWh',
    'Lab-Nuevo,2026-11-18,energia,19,kWh', 'Lab-Nuevo,2026-11-19,energia,20,kWh',
    'Lab-Nuevo,2026-11-20,energia,22,kWh', 'Lab-Nuevo,2026-11-23,energia,20,kWh',
    'Lab-Nuevo,2026-11-24,energia,21,kWh', 'Lab-Nuevo,2026-11-25,energia,18,',
    'Lab-Nuevo,2026-11-26,energia,20,kWh', 'Lab-Nuevo,2026-11-27,energia,19,',
  ];
  const r = core.importarCSV([ENC, ...filas].join('\n'));
  assert.equal(r.aceptadas.length, 8);
  assert.deepEqual(r.rechazadas.map((x) => x.motivo), ['sin unidad', 'sin unidad']);
  assert.equal(typeof core.diasSinDato, 'function', 'falta la función diasSinDato');
  const [lab] = core.diasSinDato(r.aceptadas);
  assert.equal(lab.espacio, 'Lab-Nuevo');
  assert.deepEqual(lab.faltantes, ['2026-11-21', '2026-11-22', '2026-11-25']);
});

test('HU-13 · con menos de 4 semanas previas se indica «linea base en construcción (n/4 semanas)» y no se emite alerta', () => {
  const l = [];
  for (let s = 0; s < 3; s++) {
    for (let d = 0; d < 5; d++) {
      l.push({ espacio: 'Lab-Nuevo', tipo: 'energia', unidad: 'kWh', valor: s === 2 ? 30 : 20,
        fecha: new Date(Date.UTC(2026, 10, 9 + 7 * s + d)).toISOString().slice(0, 10) });
    }
  }
  const r = core.compararSemana(l, 'Lab-Nuevo'); // semana actual +50 %, pero solo 2 semanas previas
  assert.equal(r.estado, 'línea base en construcción (2/4 semanas)');
  assert.equal(r.alerta, null);
});
