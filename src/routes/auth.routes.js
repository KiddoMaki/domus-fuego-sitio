import { Router } from "express";
import * as controller from "../controllers/auth.controller.js";
import { asyncHandler, authenticate, schemas, validate } from "../middleware/index.js";

const router = Router();

router.post(
  "/login",
  validate({ body: schemas.loginBody }),
  asyncHandler(controller.login)
);
router.post(
  "/register",
  validate({ body: schemas.registerBody }),
  asyncHandler(controller.register)
);
router.get("/me", authenticate, asyncHandler(controller.me));

export default router;
