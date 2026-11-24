// Enrutador principal: /api/products, /api/orders, /api/reservations, /api/health.
import { Router } from "express";
import admin from "./admin.routes.js";
import auth from "./auth.routes.js";
import health from "./health.routes.js";
import orders from "./orders.routes.js";
import products from "./products.routes.js";
import reservations from "./reservations.routes.js";

const router = Router();
router.use("/admin", admin);
router.use("/auth", auth);
router.use("/products", products);
router.use("/orders", orders);
router.use("/reservations", reservations);
router.use("/health", health);

export default router;
