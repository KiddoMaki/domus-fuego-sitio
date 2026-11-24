import { reservationService } from "../services/index.js";
import { notFoundError } from "../utils/http-error.js";

export async function getHistory(req, res) {
  return res.json(await reservationService.history(req.auth.clienteId));
}

export async function getReservation(req, res) {
  const rawId = req.valid?.params?.id ?? req.valid?.query?.id;
  const reservation = await reservationService.getById(Number(rawId));
  if (!reservation) throw notFoundError("Reserva no encontrada");
  return res.json(reservation);
}

export async function createReservation(req, res) {
  const reservation = await reservationService.create(req.valid.body);
  return res.status(201).json(reservation);
}
