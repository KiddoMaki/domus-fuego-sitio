// Aplica un archivo SQL de migración a Neon en una sola transacción.
// Uso: npm run migrate -- db/migrations/008_item_unidades_logica.sql
import fs from "node:fs";
import dns from "node:dns";
import { Pool } from "@neondatabase/serverless";

dns.setDefaultResultOrder("ipv4first");

const file = process.argv[2];
if (!file) {
  console.error("Uso: npm run migrate -- db/migrations/<archivo>.sql");
  process.exit(1);
}

const sql = fs.readFileSync(file, "utf8");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  await client.query("BEGIN");
  await client.query(sql);
  await client.query("COMMIT");
  console.log("Migración aplicada:", file);
} catch (error) {
  await client.query("ROLLBACK");
  console.error("Error al aplicar la migración:", error.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
