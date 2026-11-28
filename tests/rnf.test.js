import test from 'node:test';
import assert from 'node:assert/strict';
import { importarCSV, compararSemana, espacios } from '../src/core.js';

test('RNF-01 · 5 000 lecturas se importan y comparan en menos de 5 segundos', () => {
  const filas = ['espacio,fecha,tipo,valor,unidad'];
  for (let i = 0; i < 5000; i++) {
    const fecha = new Date(Date.UTC(2025, 0, 1 + Math.floor(i / 10))).toISOString().slice(0, 10);
    filas.push(`Esp-${i % 10},${fecha},energia,${10 + (i % 7)},kWh`);
  }
  const inicio = performance.now();
  const { aceptadas } = importarCSV(filas.join('\n'));
  for (const e of espacios(aceptadas)) compararSemana(aceptadas, e);
  const ms = performance.now() - inicio;
  assert.equal(aceptadas.length, 5000);
  assert.ok(ms < 5000, `tardó ${ms.toFixed(0)} ms`);
});
