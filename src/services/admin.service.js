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

// La bitácora nunca debe impedir una operación válida del panel.
const logAction = async (actor, modulo, accion, detalle) => {
  try {
    await adminModel.log({
      actor: actor?.nombre || "Administrador",
      modulo,
      accion,
      detalle,
      ip: actor?.ip ?? null,
    });
  } catch (error) {
    console.error("No se pudo registrar en auditoría:", error.message);
  }
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
  logs: (limit) => adminModel.logs(limit),
  itemUnidades: () => adminModel.itemUnidades(),

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

  async create(table, values, actor) {
    try {
      const row = await adminModel.create(table, values);
      await logAction(actor, table, "Crear registro", `Alta en ${table}: ${JSON.stringify(row).slice(0, 500)}`);
      return row;
    } catch (error) {
      translate(error);
    }
  },

  async update(table, id, values, actor) {
    try {
      const row = await adminModel.update(table, id, values);
      await logAction(actor, table, "Editar registro", `${table} #${id}: ${JSON.stringify(values).slice(0, 500)}`);
      return row;
    } catch (error) {
      translate(error);
    }
  },

  async remove(table, id, actor) {
    try {
      const row = await adminModel.remove(table, id);
      await logAction(actor, table, "Eliminar registro", `${table} #${id}`);
      return row;
    } catch (error) {
      translate(error);
    }
  },

  async setReservationStatus(id, estado, actor) {
    if (!RESERVATION_STATES.includes(estado)) throw badRequest("Estado de reserva no válido");
    const row = await adminModel.setReservationStatus(id, estado);
    if (!row) throw notFoundError("Reserva no encontrada");
    await logAction(actor, "reserva", "Cambiar estado", `Reserva #${id} → ${estado}`);
    return row;
  },

  async setOrderStatus(id, estado, actor) {
    if (!ORDER_STATES.includes(estado)) throw badRequest("Estado de pedido no válido");
    const row = await adminModel.setOrderStatus(id, estado);
    if (!row) throw notFoundError("Pedido no encontrado");
    await logAction(actor, "pedido", "Cambiar estado", `Pedido #${id} → ${estado}`);
    return row;
  },

  async setTableActive(id, activa, actor) {
    const row = await adminModel.setTableActive(id, Boolean(activa));
    if (!row) throw notFoundError("Mesa no encontrada");
    await logAction(actor, "mesa", "Cambiar disponibilidad", `Mesa #${id} → ${activa ? "activa" : "inactiva"}`);
    return row;
  },

  async createUser({ nombre, email, password, rol = "CLIENTE" }, actor) {
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
    await logAction(actor, "usuarios", "Crear usuario", `${email} con rol ${rol}`);
    return { ...user, roles: [rol] };
  },
};
