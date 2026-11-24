// MIDDLEWARE: limpia entradas antes de validar (recorta espacios y quita caracteres de control).
// No muta req.body/req.query (en Express 5 req.query es de solo lectura): deja req.sanitized.
export function clean(value) {
  if (typeof value === "string") {
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  }
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clean(item)]));
  }
  return value;
}

export function sanitize(req, _res, next) {
  req.sanitized = {
    body: clean(req.body ?? {}),
    query: clean({ ...req.query }),
    params: clean({ ...req.params }),
  };
  next();
}
