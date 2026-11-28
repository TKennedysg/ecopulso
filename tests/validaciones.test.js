// HU-07 (criterio de datos insuficientes) y validaciones de entrada del CSV.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importarCSV, compararSemana, fechaValida } from '../src/core.js';

const ENC = 'espacio,fecha,tipo,valor,unidad';

// 4 semanas completas de 100 kWh (lun-vie) y una semana actual con `dias` lecturas de 30 kWh.
function historial(dias) {
  const l = [];
  for (let s = 0; s < 4; s++) {
    for (let d = 0; d < 5; d++) {
      l.push({ espacio: 'Lab-1', tipo: 'energia', unidad: 'kWh', valor: 20,
        fecha: new Date(Date.UTC(2026, 9, 26 + 7 * s + d)).toISOString().slice(0, 10) });
    }
  }
  for (let d = 0; d < dias; d++) {
    l.push({ espacio: 'Lab-1', tipo: 'energia', unidad: 'kWh', valor: 30,
      fecha: new Date(Date.UTC(2026, 10, 23 + d)).toISOString().slice(0, 10) });
  }
  return l;
}

test('HU-07 · una semana con más de 2 días sin dato no emite alerta e indica «datos insuficientes»', () => {
  const r = compararSemana(historial(4), 'Lab-1'); // 4 lecturas de 30 = 120 kWh (+20 %), pero 3 días sin dato
  assert.equal(r.alerta, null);
  assert.match(r.estado, /^datos insuficientes/);
  assert.equal(r.diasSinDato, 3);
});

test('HU-07 · con exactamente 2 días sin dato la alerta sí se evalúa', () => {
  const r = compararSemana(historial(5), 'Lab-1'); // 150 kWh frente a 100: +50 %
  assert.equal(r.estado, 'alerta');
  assert.equal(r.diasSinDato, 2);
});

test('Validación · se rechazan fechas imposibles aunque tengan el formato AAAA-MM-DD', () => {
  assert.equal(fechaValida('2026-11-30'), true);
  assert.equal(fechaValida('2026-99-99'), false);
  assert.equal(fechaValida('2026-02-30'), false);
  const r = importarCSV(`${ENC}\nLab-1,2026-99-99,energia,10,kWh\nLab-1,2026-02-30,energia,10,kWh`);
  assert.equal(r.aceptadas.length, 0);
  assert.deepEqual(r.rechazadas.map((x) => x.motivo), [
    'espacio o fecha no válidos (use AAAA-MM-DD)',
    'espacio o fecha no válidos (use AAAA-MM-DD)',
  ]);
});

test('Validación · «Infinity» no se acepta como consumo', () => {
  const r = importarCSV(`${ENC}\nLab-1,2026-11-02,energia,Infinity,kWh\nLab-1,2026-11-03,energia,-Infinity,kWh`);
  assert.equal(r.aceptadas.length, 0);
  assert.deepEqual(r.rechazadas.map((x) => x.motivo), ['valor no numérico', 'valor no numérico']);
});
