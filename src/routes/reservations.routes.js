import { Router } from "express";
import * as controller from "../controllers/reservation.controller.js";
import {
  authenticate,
  asyncHandler,
  requireContact,
  schemas,
  validate,
} from "../middleware/index.js";

const router = Router();

router.get("/history", authenticate, asyncHandler(controller.getHistory));
router.get(
  "/",
  validate({ query: schemas.idQuery }),
  asyncHandler(controller.getReservation)
);
router.get(
  "/:id",
  validate({ params: schemas.idParam }),
  asyncHandler(controller.getReservation)
);
router.post(
  "/",
  validate({ body: schemas.reservationBody, check: requireContact }),
  asyncHandler(controller.createReservation)
);

export default router;
