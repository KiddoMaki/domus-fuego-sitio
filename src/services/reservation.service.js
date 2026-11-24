// SERVICIO: coordina cliente + reserva y traduce el conflicto de mesas a HTTP.
import { customerModel, reservationModel } from "../models/index.js";
import { conflict } from "../utils/http-error.js";

export const reservationService = {
  getById(id) {
    return reservationModel.findById(id);
  },

  async history(clientId) {
    if (!clientId) return { vigentes: [], historial: [] };
    const rows = await reservationModel.history(clientId);
    return {
      vigentes: rows.filter((row) => row.vigente),
      historial: rows.filter((row) => !row.vigente),
    };
  },

  async create(payload) {
    const { customer, fecha, hora, comensales, observaciones } = payload;
    const customerId = await customerModel.findOrCreate({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    });

    const result = await reservationModel.create({
      customerId,
      fecha,
      hora,
      comensales: Number(comensales),
      observaciones,
    });

    if (result.conflict) {
      throw conflict(
        "No hay mesa disponible para esa fecha, hora y número de personas. Llámanos al 0983067670."
      );
    }
    return result;
  },
};
