// Rutas del panel: todas exigen JWT y el rol ADMINISTRADOR.
import { Router } from "express";
import * as controller from "../controllers/admin.controller.js";
import {
  asyncHandler,
  authenticate,
  requireRoles,
  schemas,
  validate,
} from "../middleware/index.js";

const router = Router();
router.use(authenticate, requireRoles("ADMINISTRADOR"));

router.get("/overview", asyncHandler(controller.overview));
router.get("/catalog", asyncHandler(controller.catalog));
router.get("/reservations", asyncHandler(controller.reservations));
router.get("/orders", asyncHandler(controller.orders));
router.get("/users", asyncHandler(controller.users));
router.get("/tables", asyncHandler(controller.tables));
router.get("/inventory", asyncHandler(controller.inventory));
router.get("/purchases", asyncHandler(controller.purchases));
router.get("/production", asyncHandler(controller.production));
router.get("/finance", asyncHandler(controller.finance));
router.get("/cash", asyncHandler(controller.cash));
router.get("/sales", asyncHandler(controller.sales));
router.get("/audit", asyncHandler(controller.audit));

router.patch(
  "/reservations/:id/estado",
  validate({ params: schemas.idParam, body: schemas.adminStatusBody }),
  asyncHandler(controller.setReservationStatus)
);
router.patch(
  "/orders/:id/estado",
  validate({ params: schemas.idParam, body: schemas.adminStatusBody }),
  asyncHandler(controller.setOrderStatus)
);
router.patch(
  "/tables/:id/activa",
  validate({ params: schemas.idParam }),
  asyncHandler(controller.setTableActive)
);
router.post(
  "/users",
  validate({ body: schemas.adminUserBody }),
  asyncHandler(controller.createUser)
);

// Acceso genérico a las tablas permitidas (altas, ediciones y bajas).
router.get("/data/:table/schema", validate({ params: schemas.adminTableBody }), asyncHandler(controller.schema));
router.get("/data/:table", validate({ params: schemas.adminTableBody }), asyncHandler(controller.list));
router.get(
  "/data/:table/:id",
  validate({ params: { ...schemas.idParam, ...schemas.adminTableBody } }),
  asyncHandler(controller.find)
);
router.post("/data/:table", validate({ params: schemas.adminTableBody }), asyncHandler(controller.create));
router.patch(
  "/data/:table/:id",
  validate({ params: { ...schemas.idParam, ...schemas.adminTableBody } }),
  asyncHandler(controller.update)
);
router.delete(
  "/data/:table/:id",
  validate({ params: { ...schemas.idParam, ...schemas.adminTableBody } }),
  asyncHandler(controller.remove)
);

export default router;
