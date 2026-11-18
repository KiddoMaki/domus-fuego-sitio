import { fail } from "./http.mjs";

export function compose(...middlewares) {
  return (event, context) => {
    const ctx = { event, context };
    const run = async (i) => {
      if (i >= middlewares.length) return null;
      const result = await middlewares[i](ctx, () => run(i + 1));
      return result ?? null;
    };
    return run(0);
  };
}

export async function handleErrors(ctx, next) {
  try { return await next(); }
  catch (error) {
    console.error(error);
    return fail(500, "Error interno del servidor");
  }
}

export async function withCors(ctx, next) {
  const response = await next();
  if (!response) return null;

  const allowedOrigins = (
    process.env.CORS_ALLOWED_ORIGINS ||
    process.env.PUBLIC_SITE_URL ||
    ""
  )
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  const requestOrigin = ctx.event.headers?.origin || ctx.event.headers?.Origin;

  const corsHeaders = {
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  if (requestOrigin && allowedOrigins.includes(requestOrigin.replace(/\/$/, ""))) {
    corsHeaders["Access-Control-Allow-Origin"] = requestOrigin;
  }

  return { ...response, headers: { ...corsHeaders, ...response.headers } };
}

export async function parseJson(ctx, next) {
  if (ctx.event.body) {
    try { ctx.body = JSON.parse(ctx.event.body); }
    catch { return fail(400, "JSON inválido"); }
  }
  return next();
}

export function requireFields(...names) {
  return async (ctx, next) => {
    const missing = names.filter((name) => ctx.body?.[name] == null || ctx.body[name] === "");
    if (missing.length) return fail(422, `Campos requeridos: ${missing.join(", ")}`);
    return next();
  };
}
