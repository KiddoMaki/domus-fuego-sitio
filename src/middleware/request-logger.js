// MIDDLEWARE de logs: id de petición + método, ruta, status y duración.
import { randomUUID } from "node:crypto";

export function requestId(req, res, next) {
  req.id = req.headers["x-request-id"] || randomUUID();
  res.set("X-Request-Id", req.id);
  next();
}

export function requestLogger(req, res, next) {
  const started = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - started;
    console.log(
      `[${req.id}] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`
    );
  });
  next();
}
