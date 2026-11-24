// Token JWT firmado con HMAC-SHA256 usando JWT_SECRET.
import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "../config/env.js";

const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const decode = (value) => JSON.parse(Buffer.from(value, "base64url").toString("utf8"));

export function signToken(payload, expiresInSeconds = 7 * 24 * 60 * 60) {
  const header = encode({ alg: "HS256", typ: "JWT" });
  const now = Math.floor(Date.now() / 1000);
  const body = encode({ ...payload, iat: now, exp: now + expiresInSeconds });
  const signature = createHmac("sha256", config.jwtSecret)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token) {
  const parts = String(token ?? "").split(".");
  if (parts.length !== 3) throw new Error("Token inválido");

  const [header, body, signature] = parts;
  const expected = createHmac("sha256", config.jwtSecret)
    .update(`${header}.${body}`)
    .digest();
  const received = Buffer.from(signature, "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new Error("Firma inválida");
  }

  const payload = decode(body);
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expirado");
  }
  return payload;
}
