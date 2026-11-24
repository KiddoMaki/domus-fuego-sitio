import { config } from "../config/env.js";
import { getDb } from "../database/connection.js";

export async function health(req, res) {
  let database = "ok";
  try {
    await getDb().execute("SELECT 1");
  } catch {
    database = "error";
  }
  return res.json({
    status: database === "ok" ? "ok" : "degraded",
    database,
    env: config.nodeEnv,
    uptime: process.uptime(),
  });
}
