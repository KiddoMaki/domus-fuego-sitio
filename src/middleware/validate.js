// MIDDLEWARE de validación: esquemas declarativos por body/query/params.
// Los errores se entregan al manejador central con status 422.
import { HttpError } from "../utils/http-error.js";
import { clean } from "./sanitize.js";

const checks = {
  string: (value) => typeof value === "string",
  integer: (value) =>
    typeof value === "number"
      ? Number.isInteger(value)
      : /^-?\d+$/.test(String(value ?? "").trim()),
  number: (value) => !Number.isNaN(Number(value)),
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "")),
  date: (value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? "")) &&
    !Number.isNaN(Date.parse(String(value))),
  time: (value) => /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(String(value ?? "")),
  array: (value) => Array.isArray(value),
  object: (value) => value !== null && typeof value === "object" && !Array.isArray(value),
  boolean: (value) => typeof value === "boolean" || ["true", "false"].includes(value),
};

function valuesAt(source, path) {
  let current = [source];
  for (const part of path.replace(/\[\]/g, "").split(".")) {
    const next = [];
    for (const value of current) {
      if (value == null) continue;
      if (Array.isArray(value)) value.forEach((item) => next.push(item?.[part]));
      else next.push(value[part]);
    }
    current = next;
  }
  return current.length ? current : [undefined];
}

function validateField(value, rule, path, errors) {
  const missing = value === undefined || value === null || value === "";
  if (missing) {
    if (rule.required) errors.push(`${path} es requerido`);
    return;
  }

  if (rule.in && !rule.in.includes(value)) {
    errors.push(`${path} debe ser uno de: ${rule.in.join(", ")}`);
    return;
  }
  if (rule.type && !(checks[rule.type] ?? (() => true))(value)) {
    errors.push(`${path} no es un ${rule.type.replace(/^./, (c) => c.toUpperCase())} válido`);
    return;
  }

  if (rule.type === "string" || rule.type === "email") {
    const length = String(value).length;
    if (rule.min != null && length < rule.min) errors.push(`${path} debe tener al menos ${rule.min} caracteres`);
    if (rule.max != null && length > rule.max) errors.push(`${path} debe tener como máximo ${rule.max} caracteres`);
    if (rule.pattern && !rule.pattern.test(String(value))) errors.push(`${path} tiene un formato inválido`);
  }
  if (rule.type === "integer" || rule.type === "number") {
    if (rule.min != null && Number(value) < rule.min) errors.push(`${path} debe ser >= ${rule.min}`);
    if (rule.max != null && Number(value) > rule.max) errors.push(`${path} debe ser <= ${rule.max}`);
  }
  if (rule.type === "array") {
    if (rule.minItems != null && value.length < rule.minItems) errors.push(`${path} debe tener al menos ${rule.minItems} elementos`);
    if (rule.maxItems != null && value.length > rule.maxItems) errors.push(`${path} debe tener como máximo ${rule.maxItems} elementos`);
  }
}

export function validate(schema = {}) {
  return (req, _res, next) => {
    const errors = [];
    const sanitized = req.sanitized ?? {
      body: req.body ?? {},
      query: { ...req.query },
      params: { ...req.params },
    };
    // Los parámetros de ruta se resuelven después del middleware global, por lo
    // que aquí se toman directamente de req.params (ya saneados).
    const sources = {
      ...sanitized,
      params: Object.keys(req.params ?? {}).length
        ? clean({ ...req.params })
        : sanitized.params ?? {},
    };

    for (const section of ["body", "query", "params"]) {
      const fields = schema[section];
      if (!fields) continue;
      for (const [path, rule] of Object.entries(fields)) {
        for (const value of valuesAt(sources[section] ?? {}, path)) {
          validateField(value, rule, path, errors);
        }
      }
    }

    if (schema.check) {
      const message = schema.check(sanitized);
      if (message) errors.push(message);
    }

    if (errors.length) return next(new HttpError(422, errors.join("; ")));
    req.valid = sanitized;
    return next();
  };
}

const customer = {
  customer: { type: "object", required: true },
  "customer.name": { type: "string", required: true, min: 2, max: 120 },
  "customer.email": { type: "email", max: 120 },
  "customer.phone": { type: "string", max: 30 },
};

export const requireContact = ({ body }) =>
  !body?.customer?.email && !body?.customer?.phone
    ? "Se requiere customer.email o customer.phone"
    : null;

export const schemas = {
  idParam: { id: { type: "integer", required: true, min: 1 } },
  idQuery: { id: { type: "integer", required: true, min: 1 } },
  productQuery: {
    id: { type: "integer", min: 1 },
    category: { type: "string", max: 60 },
    q: { type: "string", max: 120 },
    meta: { type: "string", in: ["categories"] },
    page: { type: "integer", min: 1 },
    limit: { type: "integer", min: 1, max: 100 },
  },
  orderBody: {
    ...customer,
    items: { type: "array", required: true, minItems: 1, maxItems: 50 },
    "items[].product_id": { type: "integer", required: true, min: 1 },
    "items[].quantity": { type: "integer", required: true, min: 1, max: 100 },
  },
  loginBody: {
    email: { type: "email", required: true, max: 160 },
    password: { type: "string", required: true, min: 4, max: 100 },
  },
  registerBody: {
    nombre: { type: "string", required: true, min: 2, max: 120 },
    email: { type: "email", required: true, max: 160 },
    password: { type: "string", required: true, min: 4, max: 100 },
  },
  reservationBody: {
    ...customer,
    fecha: { type: "date", required: true },
    hora: { type: "time", required: true },
    comensales: { type: "integer", required: true, min: 1, max: 20 },
    observaciones: { type: "string", max: 500 },
  },
  adminStatusBody: {
    estado: { type: "string", required: true, min: 3, max: 20 },
  },
  adminUserBody: {
    nombre: { type: "string", required: true, min: 2, max: 120 },
    email: { type: "email", required: true, max: 160 },
    password: { type: "string", required: true, min: 4, max: 100 },
    rol: { type: "string", in: ["CLIENTE", "ADMINISTRADOR"] },
  },
  adminTableBody: {
    table: { type: "string", required: true, max: 60 },
  },
};
