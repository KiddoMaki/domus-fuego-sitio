import { orderService } from "../services/index.js";
import { notFoundError } from "../utils/http-error.js";

export async function getOrder(req, res) {
  const rawId = req.valid?.params?.id ?? req.valid?.query?.id;
  const order = await orderService.getById(Number(rawId));
  if (!order) throw notFoundError("Pedido no encontrado");
  return res.json(order);
}

export async function createOrder(req, res) {
  const order = await orderService.create(req.valid.body);
  return res.status(201).json(order);
}
