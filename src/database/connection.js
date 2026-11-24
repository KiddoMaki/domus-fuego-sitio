// Capa de infraestructura: una sola conexión (pool) compartida por todos los modelos.
// Neon Serverless habla HTTPS/WebSocket (443) y funciona dentro de Netlify Functions.
import dns from "node:dns";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema.js";

// Esta máquina resuelve IPv6 primero pero no tiene ruta; priorizar IPv4 evita EAI_AGAIN.
dns.setDefaultResultOrder("ipv4first");
neonConfig.webSocketConstructor = ws;

let db;

export function getDb() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("Falta DATABASE_URL");
    const pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 10_000,
    });
    db = drizzle({ client: pool, schema });
  }
  return db;
}

export { schema };
