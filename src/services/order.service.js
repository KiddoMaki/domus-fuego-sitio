// SERVICIO: valida precios contra la BD, arma el pedido y lo persiste.
import { OrderBuilder } from "../domain/order.builder.js";
import { customerModel, orderModel, productModel } from "../models/index.js";
import { unprocessable } from "../utils/http-error.js";

export const orderService = {
  getById(id) {
    return orderModel.findById(id);
  },

  async create({ customer, items }) {
    const ids = [...new Set(items.map((item) => Number(item.product_id)))];
    const found = await productModel.findByIds(ids);
    const priceById = new Map(found.map((p) => [Number(p.id), Number(p.precio)]));

    const customerId = await customerModel.findOrCreate({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    });

    const builder = new OrderBuilder(customerId);
    for (const item of items) {
      const productId = Number(item.product_id);
      const unitPrice = priceById.get(productId);
      const quantity = Number(item.quantity);
      if (unitPrice == null) {
        throw unprocessable(`Producto desconocido o no disponible: ${item.product_id}`);
      }
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw unprocessable(`Cantidad inválida para el producto ${item.product_id}`);
      }
      builder.addItem(productId, quantity, unitPrice);
    }

    return orderModel.create(builder.calculateTotal().build());
  },
};
