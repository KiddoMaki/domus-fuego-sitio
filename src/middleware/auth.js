// MIDDLEWARE de seguridad: valida el JWT y, si se pide, los roles.
import { forbidden, unauthorized } from "../utils/http-error.js";
import { verifyToken } from "../utils/token.js";

export function authenticate(req, _res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) return next(unauthorized("Inicia sesión para continuar"));

  try {
    const payload = verifyToken(token);
    req.auth = {
      id: payload.sub,
      roles: payload.roles ?? [],
      clienteId: payload.clienteId ?? null,
      nombre: payload.nombre ?? null,
    };
    return next();
  } catch {
    return next(unauthorized("Sesión inválida o expirada"));
  }
}

export function requireRoles(...allowed) {
  return (req, _res, next) => {
    if (!req.auth) return next(unauthorized("Inicia sesión para continuar"));
    if (!allowed.some((role) => req.auth.roles.includes(role))) {
      return next(forbidden("No tienes permiso para realizar esta acción"));
    }
    return next();
  };
}
