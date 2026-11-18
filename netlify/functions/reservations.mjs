import { createRepository } from "./_shared/repository.factory.mjs";
import { ok, fail } from "./_shared/http.mjs";
import { compose, handleErrors, withCors, parseJson } from "./_shared/middleware.mjs";

const reservations = createRepository("reservations");
const customers = createRepository("customers");

const route = async (ctx) => {
  const { httpMethod, queryStringParameters } = ctx.event;

  if (httpMethod === "OPTIONS") return ok({});

  if (httpMethod === "GET") {
    const id = Number(queryStringParameters?.id);
    if (!Number.isInteger(id)) return fail(400, "Falta el parámetro id");
    const reservation = await reservations.findById(id);
    return reservation ? ok(reservation) : fail(404, "Reserva no encontrada");
  }

  if (httpMethod === "POST") {
    const { customer, fecha, hora, comensales, observaciones } = ctx.body ?? {};
    if (!customer?.name || (!customer?.email && !customer?.phone)) {
      return fail(422, "Campos requeridos: customer.name y customer.email o customer.phone");
    }
    if (!fecha || !hora) return fail(422, "Campos requeridos: fecha, hora");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fail(422, "fecha debe ser AAAA-MM-DD");
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(hora)) return fail(422, "hora debe ser HH:MM");
    const party = Number(comensales);
    if (!Number.isInteger(party) || party <= 0 || party > 20) {
      return fail(422, "comensales debe ser un entero entre 1 y 20");
    }

    const customerId = await customers.findOrCreate({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    });

    const result = await reservations.create({
      customerId,
      fecha,
      hora,
      comensales: party,
      observaciones,
    });

    if (result.conflict) {
      return fail(409, "No hay mesa disponible para esa fecha, hora y número de personas. Llámanos al 0983067670.");
    }
    return ok(result, 201);
  }

  return fail(405, "Método no permitido");
};

export const handler = compose(handleErrors, withCors, parseJson, route);
