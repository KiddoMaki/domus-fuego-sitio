import { Router } from "express";
import * as controller from "../controllers/product.controller.js";
import { asyncHandler, paginate, schemas, validate } from "../middleware/index.js";

const router = Router();

router.get(
  "/",
  paginate(),
  validate({ query: schemas.productQuery }),
  asyncHandler(controller.listProducts)
);
router.get(
  "/:id",
  validate({ params: schemas.idParam }),
  asyncHandler(controller.getProduct)
);

export default router;
