import { Router } from "express";
import { categoryIdParamsSchema, createCategorySchema, updateCategorySchema } from "@cartazo/shared";
import { categoryController } from "../controllers/category.controller.js";
import { validate } from "../middleware/validate.js";
import { catchAsync } from "../middleware/catchAsync.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

export const categoryRouter = Router();

categoryRouter.get("/", catchAsync(categoryController.list));

categoryRouter.get(
  "/:id",
  validate({ params: categoryIdParamsSchema }),
  catchAsync(categoryController.getById),
);

categoryRouter.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validate({ body: createCategorySchema }),
  catchAsync(categoryController.create),
);

categoryRouter.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validate({ params: categoryIdParamsSchema, body: updateCategorySchema }),
  catchAsync(categoryController.update),
);

categoryRouter.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validate({ params: categoryIdParamsSchema }),
  catchAsync(categoryController.remove),
);
