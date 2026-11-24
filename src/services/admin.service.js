// SERVICIO administrativo: valida reglas de negocio y traduce errores del modelo.
import { adminModel, userModel } from "../models/index.js";
import { badRequest, conflict, notFoundError } from "../utils/http-error.js";
import { hashPassword } from "../utils/password.js";

const RESERVATION_STATES = ["pendiente", "confirmada", "cancelada", "cumplida", "no_asistio"];
const ORDER_STATES = ["abierto", "en_preparacion", "servido", "cerrado", "cancelado"];
const ROLES = ["CLIENTE", "ADMINISTRADOR"];

const translate = (error) => {
  if (/no encontrado/i.test(error.message)) throw notFoundError(error.message);
  throw badRequest(error.message);
};

export const adminService = {
  overview: () => adminModel.overview(),
  catalog: () => adminModel.catalog(),
  reservations: () => adminModel.reservations(),
  orders: () => adminModel.orders(),
  users: () => adminModel.users(),
  tables: () => adminModel.tables(),
  inventory: () => adminModel.inventory(),
  purchases: () => adminModel.purchases(),
  production: () => adminModel.production(),
  finance: () => adminModel.finance(),
  cash: () => adminModel.cash(),
  sales: () => adminModel.sales(),
  audit: () => adminModel.audit(),

  schema(table) {
    try {
      return adminModel.schema(table);
    } catch (error) {
      translate(error);
    }
  },

  list(table, limit) {
    try {
      return adminModel.list(table, limit);
    } catch (error) {
      translate(error);
    }
  },

  find(table, id) {
    try {
      return adminModel.find(table, id);
    } catch (error) {
      translate(error);
    }
  },

  create(table, values) {
    try {
      return adminModel.create(table, values);
    } catch (error) {
      translate(error);
    }
  },

  update(table, id, values) {
    try {
      return adminModel.update(table, id, values);
    } catch (error) {
      translate(error);
    }
  },

  remove(table, id) {
    try {
      return adminModel.remove(table, id);
    } catch (error) {
      translate(error);
    }
  },

  async setReservationStatus(id, estado) {
    if (!RESERVATION_STATES.includes(estado)) throw badRequest("Estado de reserva no válido");
    const row = await adminModel.setReservationStatus(id, estado);
    if (!row) throw notFoundError("Reserva no encontrada");
    return row;
  },

  async setOrderStatus(id, estado) {
    if (!ORDER_STATES.includes(estado)) throw badRequest("Estado de pedido no válido");
    const row = await adminModel.setOrderStatus(id, estado);
    if (!row) throw notFoundError("Pedido no encontrado");
    return row;
  },

  async setTableActive(id, activa) {
    const row = await adminModel.setTableActive(id, Boolean(activa));
    if (!row) throw notFoundError("Mesa no encontrada");
    return row;
  },

  async createUser({ nombre, email, password, rol = "CLIENTE" }) {
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    if (!ROLES.includes(rol)) throw badRequest("Rol no válido");
    if (await userModel.findByEmail(normalizedEmail)) {
      throw conflict("Ya existe una cuenta con ese correo");
    }

    const idCliente = await userModel.createClient({
      nombre: String(nombre).trim(),
      email: normalizedEmail,
    });
    const user = await userModel.create({
      nombre: String(nombre).trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      idCliente,
    });
    await userModel.assignRole(user.id, rol);
    return { ...user, roles: [rol] };
  },
};
