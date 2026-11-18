import { getPool } from "./db.mjs";

// Cliente: el esquema DOMUS no impone unicidad en cliente.email,
// así que el alta/búsqueda por correo se resuelve aquí de forma explícita.
export class CustomersRepository {
  async findOrCreate({ name, email, phone }) {
    if (email) {
      const { rows } = await getPool().query(
        `SELECT id_cliente FROM cliente WHERE lower(email) = lower($1) LIMIT 1`,
        [email]
      );
      if (rows[0]) {
        await getPool().query(
          `UPDATE cliente SET nombre = $1, telefono = COALESCE($2, telefono) WHERE id_cliente = $3`,
          [name, phone ?? null, rows[0].id_cliente]
        );
        return rows[0].id_cliente;
      }
    }
    const { rows } = await getPool().query(
      `INSERT INTO cliente (nombre, telefono, email) VALUES ($1, $2, $3) RETURNING id_cliente`,
      [name, phone ?? null, email ?? null]
    );
    return rows[0].id_cliente;
  }
}

// Pedido = solicitud de pedido (no es venta: la venta se genera en caja con
// id_caja_sesion; ver venta en el esquema DOMUS).
export class OrdersRepository {
  async create({ customerId, total, items }) {
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `INSERT INTO pedido (id_reserva, estado, observaciones)
         VALUES (NULL, 'abierto', $1) RETURNING id_pedido`,
        [`Total solicitado: ${total.toFixed(2)} USD`]
      );
      const orderId = rows[0].id_pedido;
      for (const item of items) {
        await client.query(
          `INSERT INTO pedido_detalle (id_pedido, id_presentacion, cantidad, precio_unitario, origen)
           VALUES ($1, $2, $3, $4, 'web')`,
          [orderId, item.productId, item.quantity, item.unitPrice]
        );
      }
      await client.query("COMMIT");
      return { id: orderId, customerId, total, status: "abierto", items };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id) {
    const { rows } = await getPool().query(
      `SELECT p.id_pedido, p.estado, p.fecha_hora, p.observaciones,
              d.id_pedido_detalle, d.id_presentacion, d.cantidad, d.precio_unitario,
              i.nombre AS product_name
         FROM pedido p
         JOIN pedido_detalle d ON d.id_pedido = p.id_pedido
         JOIN item_presentacion pr ON pr.id_presentacion = d.id_presentacion
         JOIN item i ON i.id_item = pr.id_item
        WHERE p.id_pedido = $1
        ORDER BY d.id_pedido_detalle`,
      [id]
    );
    if (!rows.length) return null;
    const [first] = rows;
    const items = rows.map((r) => ({
      product_id: r.id_presentacion,
      name: r.product_name,
      quantity: Number(r.cantidad),
      unit_price: Number(r.precio_unitario),
    }));
    const total = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
    return { id: first.id_pedido, status: first.estado, fecha_hora: first.fecha_hora, total, items };
  }
}

// Reserva: asigna la mesa activa más pequeña que cumpla la capacidad y que no
// choque con otra reserva pendiente/confirmada en la misma fecha y hora.
export class ReservationsRepository {
  async create({ customerId, fecha, hora, comensales, observaciones }) {
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const { rows: mesas } = await client.query(
        `SELECT m.id_mesa, m.numero, m.capacidad,
                COALESCE((SELECT SUM(r.cantidad_comensales)
                            FROM reserva r
                           WHERE r.id_mesa = m.id_mesa
                             AND r.fecha = $1 AND r.hora = $2
                             AND r.estado IN ('pendiente', 'confirmada')), 0) AS ocupados
           FROM mesa m
          WHERE m.activa = TRUE AND m.capacidad >= $3
          ORDER BY m.capacidad ASC
          FOR UPDATE`,
        [fecha, hora, comensales]
      );
      const mesa = mesas.find((m) => Number(m.ocupados) + Number(comensales) <= Number(m.capacidad));
      if (!mesa) {
        await client.query("ROLLBACK");
        return { conflict: true };
      }
      const { rows } = await client.query(
        `INSERT INTO reserva (id_cliente, id_mesa, fecha, hora, cantidad_comensales, estado, observaciones)
         VALUES ($1, $2, $3, $4, $5, 'pendiente', $6) RETURNING id_reserva, estado`,
        [customerId, mesa.id_mesa, fecha, hora, comensales, observaciones ?? null]
      );
      await client.query("COMMIT");
      return { id: rows[0].id_reserva, status: rows[0].estado, mesa: mesa.numero, capacidad: mesa.capacidad };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id) {
    const { rows } = await getPool().query(
      `SELECT r.id_reserva, r.fecha, r.hora, r.cantidad_comensales, r.estado, r.observaciones,
              m.numero AS mesa, c.nombre AS cliente, c.telefono, c.email
         FROM reserva r
         JOIN mesa m ON m.id_mesa = r.id_mesa
         JOIN cliente c ON c.id_cliente = r.id_cliente
        WHERE r.id_reserva = $1`,
      [id]
    );
    return rows[0] ?? null;
  }
}
