import dns from "node:dns";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Esta máquina/red resuelve IPv6 primero pero no tiene ruta IPv6;
// priorizar IPv4 evita EAI_AGAIN en el driver WebSocket.
dns.setDefaultResultOrder("ipv4first");

// Neon Serverless usa HTTPS/WebSocket (443): funciona en Netlify Functions
// y en redes donde el puerto 5432 está bloqueado. Drop-in de node-postgres.
neonConfig.webSocketConstructor = ws;

let pool; // una sola instancia por entorno de la Function

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 10_000,
    });
  }
  return pool;
}
