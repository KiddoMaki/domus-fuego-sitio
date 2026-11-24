// MIDDLEWARE central de errores: convierte cualquier fallo en JSON consistente.
import { config } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

export function notFound(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, _next) {
  const status =
    error instanceof HttpError
      ? error.status
      : error.type === "entity.parse.failed"
        ? 400
        : 500;

  if (status === 500) {
    console.error(`[${req.id ?? "-"}]`, error);
  }

  res.status(status).json({
    error: status === 500 ? "Error interno del servidor" : error.message,
    ...(config.nodeEnv === "development" && status === 500 ? { detail: error.message } : {}),
    requestId: req.id,
  });
}
