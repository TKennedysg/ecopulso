import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { importarCSV, compararSemana } from '../src/core.js';

const csv = readFileSync(new URL('../data/lecturas_ejemplo.csv', import.meta.url), 'utf8');
const { aceptadas } = importarCSV(csv);

test('la alerta indica la meta semanal y cuánto bajar (mejora de la validación)', () => {
  const r = compararSemana(aceptadas, 'Lab-Redes');
  assert.equal(r.estado, 'alerta');
  assert.equal(r.meta, 115);
  assert.match(r.alerta, /Meta: 115 kWh o menos por semana \(bajar 5 kWh\)/);
});

test('un espacio normal también expone su meta sin generar alerta', () => {
  const r = compararSemana(aceptadas, 'Aula-101');
  assert.equal(r.estado, 'normal');
  assert.equal(r.meta, 69);
  assert.equal(r.alerta, null);
});
