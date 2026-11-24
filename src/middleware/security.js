// MIDDLEWARE de seguridad: cabeceras, CORS y límite de peticiones en memoria.
// Para varios procesos conviene mover el rate limit a Redis/Upstash.
import { config } from "../config/env.js";
import { PAGINATION_HEADERS } from "./pagination.js";

export function security({ windowMs, max } = config.rateLimit) {
  const hits = new Map();

  return (req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "no-store",
    });

    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now - entry.start >= windowMs) {
      hits.set(key, { start: now, count: 1 });
      if (hits.size > 10_000) hits.clear();
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((windowMs - (now - entry.start)) / 1000)));
      return res.status(429).json({ error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." });
    }
    return next();
  };
}

export function cors(allowedOrigins = config.corsAllowedOrigins) {
  return (req, res, next) => {
    const origin = req.headers.origin;
    res.set("Vary", "Origin");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Expose-Headers", PAGINATION_HEADERS);
    if (origin && allowedOrigins.includes(origin.replace(/\/$/, ""))) {
      res.set("Access-Control-Allow-Origin", origin.replace(/\/$/, ""));
    }
    if (req.method === "OPTIONS") return res.status(204).end();
    return next();
  };
}
