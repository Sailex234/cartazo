import { Router } from "express";
import { loginSchema, registerSchema } from "@cartazo/shared";
import { authController } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { catchAsync } from "../middleware/catchAsync.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  authLimiter,
  validate({ body: registerSchema }),
  catchAsync(authController.register),
);

authRouter.post("/login", authLimiter, validate({ body: loginSchema }), catchAsync(authController.login));

authRouter.post("/logout", catchAsync(authController.logout));

authRouter.get("/me", requireAuth, catchAsync(authController.me));
