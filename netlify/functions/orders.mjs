import { createRepository } from "./_shared/repository.factory.mjs";
import { ok, fail } from "./_shared/http.mjs";
import { compose, handleErrors, withCors, parseJson } from "./_shared/middleware.mjs";
import { OrderBuilder } from "./_shared/order.builder.mjs";

const orders = createRepository("orders");
const products = createRepository("products");
const customers = createRepository("customers");

const route = async (ctx) => {
  const { httpMethod, queryStringParameters } = ctx.event;

  if (httpMethod === "OPTIONS") return ok({});

  if (httpMethod === "GET") {
    const id = Number(queryStringParameters?.id);
    if (!Number.isInteger(id)) return fail(400, "Falta el parámetro id");
    const order = await orders.findById(id);
    return order ? ok(order) : fail(404, "Pedido no encontrado");
  }

  if (httpMethod === "POST") {
    const { customer, items } = ctx.body ?? {};
    if (!customer?.name || (!customer?.email && !customer?.phone)) {
      return fail(422, "Campos requeridos: customer.name y customer.email o customer.phone");
    }
    if (!Array.isArray(items) || items.length === 0) {
      return fail(422, "El pedido debe incluir al menos un artículo");
    }

    const ids = [...new Set(items.map((item) => Number(item.product_id)))];
    if (ids.some((n) => !Number.isInteger(n))) return fail(422, "product_id inválido");

    const found = await products.findByIds(ids);
    const priceById = new Map(found.map((p) => [Number(p.id), Number(p.precio)]));

    const customerId = await customers.findOrCreate({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    });

    const builder = new OrderBuilder(customerId);
    for (const item of items) {
      const productId = Number(item.product_id);
      const unitPrice = priceById.get(productId);
      const quantity = Number(item.quantity);
      if (unitPrice == null) return fail(422, `Producto desconocido o no disponible: ${item.product_id}`);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return fail(422, `Cantidad inválida para el producto ${item.product_id}`);
      }
      builder.addItem(productId, quantity, unitPrice);
    }

    const order = builder.calculateTotal().build();
    const created = await orders.create(order);
    return ok(created, 201);
  }

  return fail(405, "Método no permitido");
};

export const handler = compose(handleErrors, withCors, parseJson, route);
