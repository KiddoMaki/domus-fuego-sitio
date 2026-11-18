import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requireFields, parseJson, compose } from '../netlify/functions/_shared/middleware.mjs';

const makeCtx = (body) => ({ event: { body: body ? JSON.stringify(body) : undefined, headers: {} } });

test('requireFields devuelve 422 con los campos faltantes', async () => {
  const mw = requireFields('name', 'email');
  const ctx = makeCtx({ name: 'Luis' });
  ctx.body = { name: 'Luis' };
  const res = await mw(ctx, async () => ({ statusCode: 200, body: '{}' }));
  assert.equal(res.statusCode, 422);
  assert.match(res.body, /email/);
});

test('requireFields deja pasar cuando todo está presente', async () => {
  const mw = requireFields('name');
  const ctx = makeCtx({ name: 'Luis' });
  ctx.body = { name: 'Luis' };
  const res = await mw(ctx, async () => ({ statusCode: 200, body: 'ok' }));
  assert.equal(res.statusCode, 200);
});

test('parseJson rechaza JSON inválido con 400', async () => {
  const ctx = { event: { body: '{no es json', headers: {} } };
  const res = await parseJson(ctx, async () => ({ statusCode: 200, body: 'ok' }));
  assert.equal(res.statusCode, 400);
});

test('compose ejecuta los middleware en orden', async () => {
  const order = [];
  const a = async (ctx, next) => { order.push('a'); return next(); };
  const b = async (ctx, next) => { order.push('b'); return { statusCode: 200, body: 'done' }; };
  const handler = compose(a, b);
  const res = await handler({ headers: {} }, {});
  assert.equal(res.body, 'done');
  assert.deepEqual(order, ['a', 'b']);
});
