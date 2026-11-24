import { Router } from "express";
import * as controller from "../controllers/order.controller.js";
import {
  asyncHandler,
  requireContact,
  schemas,
  validate,
} from "../middleware/index.js";

const router = Router();

router.get(
  "/",
  validate({ query: schemas.idQuery }),
  asyncHandler(controller.getOrder)
);
router.get(
  "/:id",
  validate({ params: schemas.idParam }),
  asyncHandler(controller.getOrder)
);
router.post(
  "/",
  validate({ body: schemas.orderBody, check: requireContact }),
  asyncHandler(controller.createOrder)
);

export default router;
