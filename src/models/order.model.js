// MODELO de pedido: pedido + pedido_detalle en una sola transacción.
// No crea venta: la venta se cierra en caja (tabla venta / caja_sesion).
import { asc, eq } from "drizzle-orm";
import { getDb } from "../database/connection.js";
import {
  item,
  itemPresentacion,
  pedido,
  pedidoDetalle,
} from "../database/schema.js";

export const orderModel = {
  async create({ customerId, total, items }) {
    return getDb().transaction(async (tx) => {
      const [created] = await tx
        .insert(pedido)
        .values({
          estado: "abierto",
          observaciones: `Total solicitado: ${total.toFixed(2)} USD`,
        })
        .returning({ id: pedido.idPedido });

      for (const item of items) {
        await tx.insert(pedidoDetalle).values({
          idPedido: created.id,
          idPresentacion: item.productId,
          cantidad: item.quantity,
          precioUnitario: item.unitPrice,
          origen: "web",
        });
      }

      return {
        id: created.id,
        customerId,
        total,
        status: "abierto",
        items,
      };
    });
  },

  async findById(id) {
    const rows = await getDb()
      .select({
        id: pedido.idPedido,
        estado: pedido.estado,
        fechaHora: pedido.fechaHora,
        idPresentacion: pedidoDetalle.idPresentacion,
        cantidad: pedidoDetalle.cantidad,
        precioUnitario: pedidoDetalle.precioUnitario,
        productName: item.nombre,
      })
      .from(pedido)
      .innerJoin(pedidoDetalle, eq(pedidoDetalle.idPedido, pedido.idPedido))
      .innerJoin(
        itemPresentacion,
        eq(itemPresentacion.idPresentacion, pedidoDetalle.idPresentacion)
      )
      .innerJoin(item, eq(item.idItem, itemPresentacion.idItem))
      .where(eq(pedido.idPedido, id))
      .orderBy(asc(pedidoDetalle.idPedidoDetalle));

    if (!rows.length) return null;
    const items = rows.map((row) => ({
      product_id: row.idPresentacion,
      name: row.productName,
      quantity: Number(row.cantidad),
      unit_price: Number(row.precioUnitario),
    }));
    return {
      id: rows[0].id,
      status: rows[0].estado,
      fecha_hora: rows[0].fechaHora,
      total: items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
      items,
    };
  },
};
