// SERVICIO de autenticación: registro, inicio de sesión y sesión actual.
import { userModel } from "../models/index.js";
import { unauthorized, conflict } from "../utils/http-error.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signToken } from "../utils/token.js";

const session = (user) => ({
  token: signToken({
    sub: user.id,
    roles: user.roles,
    clienteId: user.idCliente,
    nombre: user.nombre,
  }),
  user: {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    roles: user.roles,
  },
});

export const authService = {
  async login({ email, password }) {
    const user = await userModel.findByEmail(email ?? "");
    if (!user || !user.activo || !verifyPassword(password ?? "", user.passwordHash)) {
      throw unauthorized("Correo o contraseña incorrectos");
    }
    return session(user);
  },

  async register({ nombre, email, password }) {
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
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

    // Toda cuenta nueva se crea como CLIENTE: solo ve la vista de reservas.
    await userModel.assignRole(user.id, "CLIENTE");
    user.roles = [...user.roles, "CLIENTE"];
    return session(user);
  },

  async me(id) {
    const user = await userModel.findById(id);
    if (!user || !user.activo) throw unauthorized("Sesión no válida");
    return {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      roles: user.roles,
    };
  },
};
