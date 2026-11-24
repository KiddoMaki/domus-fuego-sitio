import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:3000';
const { createApp } = await import('../src/app.js');

let server;
let base;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('GET /api/... inexistente responde 404 JSON', async () => {
  const res = await fetch(`${base}/api/no-existe`);
  const body = await res.json();
  assert.equal(res.status, 404);
  assert.match(body.error, /Ruta no encontrada/);
});

test('POST /api/orders sin items falla en la validación (422)', async () => {
  const res = await fetch(`${base}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer: { name: 'Luis', email: 'luis@example.com' }, items: [] }),
  });
  const body = await res.json();
  assert.equal(res.status, 422);
  assert.match(body.error, /items/);
  assert.ok(body.requestId);
});

test('JSON malformado responde 400', async () => {
  const res = await fetch(`${base}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{no es json',
  });
  assert.equal(res.status, 400);
});

test('OPTIONS /api/products aplica CORS', async () => {
  const res = await fetch(`${base}/api/products`, {
    method: 'OPTIONS',
    headers: { Origin: 'http://localhost:3000' },
  });
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:3000');
});

test('todas las respuestas llevan X-Request-Id y cabeceras de seguridad', async () => {
  const res = await fetch(`${base}/api/products?page=0`);
  assert.ok(res.headers.get('x-request-id'));
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
});
