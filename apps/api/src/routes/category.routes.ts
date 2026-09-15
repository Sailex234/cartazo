import { Router } from "express";
import { categoryIdParamsSchema, createCategorySchema, updateCategorySchema } from "@cartazo/shared";
import { categoryController } from "../controllers/category.controller.js";
import { validate } from "../middleware/validate.js";
import { catchAsync } from "../middleware/catchAsync.js";

export const categoryRouter = Router();

categoryRouter.get("/", catchAsync(categoryController.list));

categoryRouter.get(
  "/:id",
  validate({ params: categoryIdParamsSchema }),
  catchAsync(categoryController.getById),
);

categoryRouter.post(
  "/",
  validate({ body: createCategorySchema }),
  catchAsync(categoryController.create),
);

categoryRouter.put(
  "/:id",
  validate({ params: categoryIdParamsSchema, body: updateCategorySchema }),
  catchAsync(categoryController.update),
);

categoryRouter.delete(
  "/:id",
  validate({ params: categoryIdParamsSchema }),
  catchAsync(categoryController.remove),
);
