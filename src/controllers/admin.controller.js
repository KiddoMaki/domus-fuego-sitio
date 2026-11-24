// CONTROLADOR administrativo: traduce req/res hacia el servicio de administración.
import { adminService } from "../services/index.js";

const actorOf = (req) => ({
  nombre: req.auth?.nombre || "Administrador",
  ip: req.ip || null,
});

export async function overview(req, res) {
  return res.json(await adminService.overview());
}

export async function catalog(req, res) {
  return res.json(await adminService.catalog());
}

export async function reservations(req, res) {
  return res.json(await adminService.reservations());
}

export async function orders(req, res) {
  return res.json(await adminService.orders());
}

export async function users(req, res) {
  return res.json(await adminService.users());
}

export async function tables(req, res) {
  return res.json(await adminService.tables());
}

export async function inventory(req, res) {
  return res.json(await adminService.inventory());
}

export async function purchases(req, res) {
  return res.json(await adminService.purchases());
}

export async function production(req, res) {
  return res.json(await adminService.production());
}

export async function finance(req, res) {
  return res.json(await adminService.finance());
}

export async function cash(req, res) {
  return res.json(await adminService.cash());
}

export async function sales(req, res) {
  return res.json(await adminService.sales());
}

export async function audit(req, res) {
  return res.json(await adminService.audit());
}

export async function logs(req, res) {
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  return res.json(await adminService.logs(limit));
}

export async function itemUnidades(req, res) {
  return res.json(await adminService.itemUnidades());
}

export async function schema(req, res) {
  return res.json(await adminService.schema(req.params.table));
}

export async function list(req, res) {
  const limit = Math.min(Number(req.query.limit ?? 100), 500);
  return res.json(await adminService.list(req.params.table, limit));
}

export async function find(req, res) {
  return res.json(await adminService.find(req.params.table, req.params.id));
}

export async function create(req, res) {
  return res.status(201).json(
    await adminService.create(req.params.table, req.body, actorOf(req))
  );
}

export async function update(req, res) {
  return res.json(
    await adminService.update(req.params.table, req.params.id, req.body, actorOf(req))
  );
}

export async function remove(req, res) {
  return res.json(
    await adminService.remove(req.params.table, req.params.id, actorOf(req))
  );
}

export async function setReservationStatus(req, res) {
  return res.json(
    await adminService.setReservationStatus(
      req.params.id, req.valid.body.estado, actorOf(req)
    )
  );
}

export async function setOrderStatus(req, res) {
  return res.json(
    await adminService.setOrderStatus(
      req.params.id, req.valid.body.estado, actorOf(req)
    )
  );
}

export async function setTableActive(req, res) {
  return res.json(
    await adminService.setTableActive(req.params.id, req.body.activa, actorOf(req))
  );
}

export async function createUser(req, res) {
  return res.status(201).json(
    await adminService.createUser(req.valid.body, actorOf(req))
  );
}
