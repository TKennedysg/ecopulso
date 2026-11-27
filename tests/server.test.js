// Pruebas del servidor local: salud y protección de la ruta de administración con secreto.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { crearServidor } from '../server.mjs';

let servidor;
let base;
before(async () => {
  process.env.ECOPULSO_ADMIN_TOKEN ||= 'token-solo-para-pruebas-locales';
  servidor = crearServidor().listen(0);
  await new Promise((r) => servidor.once('listening', r));
  base = `http://127.0.0.1:${servidor.address().port}`;
});
after(() => servidor.close());

test('GET /api/health responde ok', async () => {
  const r = await fetch(`${base}/api/health`);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).status, 'ok');
});

test('GET /api/admin/info sin token responde 401', async () => {
  const r = await fetch(`${base}/api/admin/info`);
  assert.equal(r.status, 401);
});

test('GET /api/admin/info con el token del entorno responde 200', async () => {
  const r = await fetch(`${base}/api/admin/info`, { headers: { authorization: `Bearer ${process.env.ECOPULSO_ADMIN_TOKEN}` } });
  assert.equal(r.status, 200);
});
