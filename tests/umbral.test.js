// HU-08 · Configurar el umbral por espacio (issue #8).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { configurarUmbral, compararSemana } from '../src/core.js';

const semanas = (valores) => valores.map((v, i) => ({
  espacio: 'Lab-1', tipo: 'energia', unidad: 'kWh', valor: v,
  fecha: new Date(Date.UTC(2026, 9, 26 + 7 * i)).toISOString().slice(0, 10),
}));

test('HU-08 · un umbral de 25 % se registra con espacio, autor y fecha', () => {
  const r = configurarUmbral('Lab-1', 25, 'Tyrone Anchundia', new Date('2026-11-26T15:00:00Z'));
  assert.deepEqual(r, { espacio: 'Lab-1', umbral: 25, autor: 'Tyrone Anchundia', fecha: '2026-11-26T15:00:00.000Z' });
});

test('HU-08 · el nuevo umbral se aplica en el siguiente cálculo (+20 % ya no alerta con 25 %)', () => {
  const { umbral } = configurarUmbral('Lab-1', 25, 'Tyrone Anchundia');
  const r = compararSemana(semanas([100, 100, 100, 100, 120]), 'Lab-1', 'energia', umbral);
  assert.equal(r.alerta, null);
});

test('HU-08 · un umbral fuera de 5–50 % se rechaza indicando el rango permitido', () => {
  assert.throws(() => configurarUmbral('Lab-1', 60, 'Tyrone Anchundia'), /entre 5 % y 50 %/);
  assert.throws(() => configurarUmbral('Lab-1', 2, 'Tyrone Anchundia'), /entre 5 % y 50 %/);
});
