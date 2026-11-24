// MODELO de reserva: asigna la mesa activa más pequeña que sirva para los
// comensales y que no se solape con reservas pendientes/confirmadas.
import { and, asc, eq, gte, inArray, isNull, or, sql } from "drizzle-orm";
import { getDb } from "../database/connection.js";
import { cliente, mesa, reserva } from "../database/schema.js";

export const reservationModel = {
  async create({ customerId, fecha, hora, comensales, observaciones }) {
    return getDb().transaction(async (tx) => {
      const mesas = await tx
        .select({
          id: mesa.idMesa,
          numero: mesa.numero,
          capacidad: mesa.capacidad,
          ocupados: sql`coalesce((
            select sum(${reserva.cantidadComensales})
            from ${reserva}
            where ${reserva.idMesa} = ${mesa.idMesa}
              and ${reserva.fecha} = ${fecha}
              and ${reserva.hora} = ${hora}
              and ${reserva.estado} in ('pendiente', 'confirmada')
          ), 0)`.mapWith(Number),
        })
        .from(mesa)
        .where(and(eq(mesa.activa, true), gte(mesa.capacidad, comensales)))
        .orderBy(asc(mesa.capacidad))
        .for("update");

      const mesaElegida = mesas.find(
        (m) => Number(m.ocupados) + comensales <= Number(m.capacidad)
      );
      if (!mesaElegida) return { conflict: true };

      const [created] = await tx
        .insert(reserva)
        .values({
          idCliente: customerId,
          idMesa: mesaElegida.id,
          fecha,
          hora,
          cantidadComensales: comensales,
          estado: "pendiente",
          observaciones: observaciones ?? null,
        })
        .returning({ id: reserva.idReserva, estado: reserva.estado });

      return {
        id: created.id,
        status: created.estado,
        mesa: mesaElegida.numero,
        capacidad: mesaElegida.capacidad,
      };
    });
  },

  async history(clientId) {
    const rows = await getDb()
      .select({
        id: reserva.idReserva,
        fecha: reserva.fecha,
        hora: reserva.hora,
        comensales: reserva.cantidadComensales,
        estado: reserva.estado,
        observaciones: reserva.observaciones,
        mesa: mesa.numero,
      })
      .from(reserva)
      .innerJoin(mesa, eq(mesa.idMesa, reserva.idMesa))
      .where(eq(reserva.idCliente, clientId))
      .orderBy(asc(reserva.fecha), asc(reserva.hora));

    const today = new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toTimeString().slice(0, 8);
    return rows.map((row) => ({
      ...row,
      vigente:
        ["pendiente", "confirmada"].includes(row.estado) &&
        (row.fecha > today || (row.fecha === today && row.hora >= nowTime)),
    }));
  },

  async findById(id) {
    const [row] = await getDb()
      .select({
        id: reserva.idReserva,
        fecha: reserva.fecha,
        hora: reserva.hora,
        comensales: reserva.cantidadComensales,
        estado: reserva.estado,
        observaciones: reserva.observaciones,
        mesa: mesa.numero,
        cliente: cliente.nombre,
        telefono: cliente.telefono,
        email: cliente.email,
      })
      .from(reserva)
      .innerJoin(mesa, eq(mesa.idMesa, reserva.idMesa))
      .innerJoin(cliente, eq(cliente.idCliente, reserva.idCliente))
      .where(eq(reserva.idReserva, id))
      .limit(1);
    return row ?? null;
  },
};
