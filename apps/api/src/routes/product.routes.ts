import { Router } from "express";
import {
  createProductSchema,
  productIdParamsSchema,
  productQuerySchema,
  updateProductSchema,
  updateStockSchema,
} from "@cartazo/shared";
import { productController } from "../controllers/product.controller.js";
import { validate } from "../middleware/validate.js";
import { catchAsync } from "../middleware/catchAsync.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

export const productRouter = Router();

productRouter.get(
  "/",
  validate({ query: productQuerySchema }),
  catchAsync(productController.list),
);

productRouter.get(
  "/:id",
  validate({ params: productIdParamsSchema }),
  catchAsync(productController.getById),
);

productRouter.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validate({ body: createProductSchema }),
  catchAsync(productController.create),
);

productRouter.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validate({ params: productIdParamsSchema, body: updateProductSchema }),
  catchAsync(productController.update),
);

// Endpoint separado del PUT general para que ajustar stock sea una acción
// intencional/auditable, no un side-effect de una edición completa. 🔎
productRouter.patch(
  "/:id/stock",
  requireAuth,
  requireRole("ADMIN"),
  validate({ params: productIdParamsSchema, body: updateStockSchema }),
  catchAsync(productController.updateStock),
);

productRouter.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validate({ params: productIdParamsSchema }),
  catchAsync(productController.remove),
);
