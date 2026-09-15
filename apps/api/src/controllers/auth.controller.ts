import type { Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import { COOKIE_NAME } from "../middleware/auth.middleware.js";
import { env } from "../config/env.js";

// 2h para matchear el default de JWT_EXPIRES_IN. Si se cambia JWT_EXPIRES_IN
// a otra unidad de tiempo, esta constante también debería ajustarse. 🔎
const COOKIE_MAX_AGE_MS = 2 * 60 * 60 * 1000;

function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const { user, token } = await authService.register(req.body);
    setAuthCookie(res, token);
    res.status(201).json({ data: user });
  },

  async login(req: Request, res: Response): Promise<void> {
    const { user, token } = await authService.login(req.body);
    setAuthCookie(res, token);
    res.json({ data: user });
  },

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie(COOKIE_NAME);
    res.status(204).send();
  },

  async me(req: Request, res: Response): Promise<void> {
    const user = await authService.me(req.user!.userId);
    res.json({ data: user });
  },
};
