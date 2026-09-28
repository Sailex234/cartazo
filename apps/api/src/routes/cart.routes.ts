import { Router } from "express";
import { addCartItemSchema, cartItemParamsSchema, updateCartItemQuantitySchema } from "@cartazo/shared";
import { cartController } from "../controllers/cart.controller.js";
import { validate } from "../middleware/validate.js";
import { catchAsync } from "../middleware/catchAsync.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const cartRouter = Router();

// requireAuth en todo el router, sin requireRole -- cualquier usuario
// logueado (ADMIN o CLIENTE) tiene su propio carrito.
cartRouter.use(requireAuth);

cartRouter.get("/", catchAsync(cartController.get));

cartRouter.post("/items", validate({ body: addCartItemSchema }), catchAsync(cartController.addItem));

cartRouter.patch(
  "/items/:productId",
  validate({ params: cartItemParamsSchema, body: updateCartItemQuantitySchema }),
  catchAsync(cartController.updateItem),
);

cartRouter.delete(
  "/items/:productId",
  validate({ params: cartItemParamsSchema }),
  catchAsync(cartController.removeItem),
);

cartRouter.delete("/", catchAsync(cartController.clear));
