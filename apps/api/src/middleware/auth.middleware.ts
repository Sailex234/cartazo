import type { NextFunction, Request, Response } from "express";
import type { Role } from "@cartazo/shared";
import { verifyJwt, type JwtPayload } from "../lib/jwt.js";
import { ForbiddenError, UnauthorizedError } from "../errors/AppError.js";

declare global {
  // Única forma de extender el tipo Request de Express con `user`. 🔎
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const COOKIE_NAME = "token";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!token) return next(new UnauthorizedError("Authentication required"));

  try {
    req.user = verifyJwt(token);
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError("Authentication required"));
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError("You do not have permission to perform this action"));
    }
    next();
  };
}
