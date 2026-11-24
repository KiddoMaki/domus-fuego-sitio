import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrderBuilder } from '../src/domain/order.builder.js';

test('calcula el total a partir de cantidad × precio unitario', () => {
  const order = new OrderBuilder(7)
    .addItem(1, 2, 6.9)   // 13.80
    .addItem(2, 1, 18.0)  // 18.00
    .calculateTotal()
    .build();
  assert.equal(order.total, 13.8 + 18.0);
  assert.equal(order.customerId, 7);
  assert.equal(order.items.length, 2);
});

test('build sin artículos falla', () => {
  assert.throws(() => new OrderBuilder(1).calculateTotal().build(), /no tiene artículos/);
});

test('build sin calcular el total falla', () => {
  assert.throws(() => new OrderBuilder(1).addItem(1, 1, 5).build(), /Falta calcular el total/);
});

test('Object.freeze impide mutar el pedido construido', () => {
  const order = new OrderBuilder(1).addItem(1, 1, 5).calculateTotal().build();
  assert.throws(() => { order.total = 999; }, TypeError);
});
