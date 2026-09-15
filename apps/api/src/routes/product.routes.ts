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
  validate({ body: createProductSchema }),
  catchAsync(productController.create),
);

productRouter.put(
  "/:id",
  validate({ params: productIdParamsSchema, body: updateProductSchema }),
  catchAsync(productController.update),
);

// Endpoint separado del PUT general para que ajustar stock sea una acción
// intencional/auditable, no un side-effect de una edición completa. 🔎
productRouter.patch(
  "/:id/stock",
  validate({ params: productIdParamsSchema, body: updateStockSchema }),
  catchAsync(productController.updateStock),
);

productRouter.delete(
  "/:id",
  validate({ params: productIdParamsSchema }),
  catchAsync(productController.remove),
);
