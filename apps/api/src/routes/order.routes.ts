import { Router } from "express";
import { orderIdParamsSchema } from "@cartazo/shared";
import { orderController } from "../controllers/order.controller.js";
import { validate } from "../middleware/validate.js";
import { catchAsync } from "../middleware/catchAsync.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const orderRouter = Router();

orderRouter.use(requireAuth);

orderRouter.post("/checkout", catchAsync(orderController.checkout));

orderRouter.get("/", catchAsync(orderController.list));

orderRouter.get("/:id", validate({ params: orderIdParamsSchema }), catchAsync(orderController.getById));
