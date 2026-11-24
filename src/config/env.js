// Capa de configuración: un único lugar para leer variables de entorno.
const list = (value) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim().replace(/\/$/, ""))
    .filter(Boolean);

export const config = Object.freeze({
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsAllowedOrigins: list(
    process.env.CORS_ALLOWED_ORIGINS || process.env.PUBLIC_SITE_URL || ""
  ),
  rateLimit: Object.freeze({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
    max: Number(process.env.RATE_LIMIT_MAX ?? 300),
  }),
  bodyLimit: process.env.BODY_LIMIT ?? "256kb",
  jwtSecret: process.env.JWT_SECRET ?? "cambia-este-secreto-en-produccion",
});
