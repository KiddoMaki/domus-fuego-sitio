import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitize } from '../src/middleware/sanitize.js';
import { paginate } from '../src/middleware/pagination.js';
import { requireContact, schemas, validate } from '../src/middleware/validate.js';

const context = (req = {}) => {
  req.body ??= {};
  req.query ??= {};
  req.params ??= {};
  return req;
};

const run = (middleware, req) => new Promise((resolve) => {
  middleware(req, {}, (error) => resolve(error));
  if (!req.__done) setImmediate(() => resolve(undefined));
});

test('sanitize recorta y elimina caracteres de control sin mutar req.body', () => {
  const req = context({ body: { name: '  Luis\u0007 ' } });
  sanitize(req, {}, () => { req.__done = true; });
  assert.equal(req.sanitized.body.name, 'Luis');
  assert.equal(req.body.name, '  Luis\u0007 ');
});

test('validate acepta un body anidado válido', async () => {
  const req = context();
  req.sanitized = {
    body: {
      customer: { name: 'Luis', email: 'luis@example.com' },
      items: [{ product_id: 1, quantity: 2 }],
    },
    query: {}, params: {},
  };
  const error = await run(validate({ body: schemas.orderBody, check: requireContact }), req);
  assert.equal(error, undefined);
  assert.equal(req.valid, req.sanitized);
});

test('validate devuelve 422 con los campos faltantes', async () => {
  const req = context();
  req.sanitized = {
    body: { customer: { name: 'L' }, items: [{ product_id: 'x' }] },
    query: {}, params: {},
  };
  const error = await run(validate({ body: schemas.orderBody, check: requireContact }), req);
  assert.equal(error.status, 422);
  assert.match(error.message, /customer\.email|customer\.phone/);
  assert.match(error.message, /items\[\]\.product_id/);
});

test('paginate limita page y limit', () => {
  const req = context();
  req.sanitized = { query: { page: '-3', limit: '999' }, body: {}, params: {} };
  paginate({ defaultLimit: 50, maxLimit: 100 })(req, {}, () => {});
  assert.deepEqual(req.pagination, { page: 1, limit: 100, offset: 0 });
});

test('validate rechaza una fecha con formato inválido', async () => {
  const req = context();
  req.sanitized = {
    body: {
      customer: { name: 'Luis', phone: '0983000000' },
      fecha: '24/11/2026', hora: '19:30', comensales: 2,
    },
    query: {}, params: {},
  };
  const error = await run(validate({ body: schemas.reservationBody }), req);
  assert.equal(error.status, 422);
  assert.match(error.message, /fecha/);
});
