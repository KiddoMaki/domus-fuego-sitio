import { Router } from "express";
import { health } from "../controllers/health.controller.js";
import { asyncHandler } from "../middleware/index.js";

const router = Router();
router.get("/", asyncHandler(health));

export default router;
