// Punto de ensamble: aquí se conectan middleware -> rutas -> controladores -> servicios -> modelos.
import express from "express";
import { join } from "node:path";
import { config } from "./config/env.js";
import {
  cors,
  errorHandler,
  notFound,
  requestId,
  requestLogger,
  sanitize,
  security,
} from "./middleware/index.js";
import routes from "./routes/index.js";
import { badRequest } from "./utils/http-error.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(requestId);
  app.use(requestLogger);
  app.use(security(config.rateLimit));
  app.use(cors(config.corsAllowedOrigins));
  // En Netlify, serverless-http entrega el body crudo como string.
  app.use((req, _res, next) => {
    // serverless-http entrega el body como Buffer y marka la petición como terminada,
    // por lo que express.json no lo lee; lo normalizamos aquí.
    const raw = Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : typeof req.body === "string" ? req.body : null;
    if (raw?.trim()) {
      try {
        req.body = JSON.parse(raw);
      } catch {
        return next(badRequest("JSON malformado"));
      }
    }
    return next();
  });
  app.use(express.json({ limit: config.bodyLimit }));
  app.use(sanitize);

  // Sitio estático (carta) servido por el mismo Express en local y en Netlify.
  app.use(express.static(join(process.cwd(), "public")));

  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
