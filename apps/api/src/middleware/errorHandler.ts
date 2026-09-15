import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";

interface ErrorBody {
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

// 4 argumentos: es lo único que le indica a Express que esto es un error
// handler y no middleware normal, aunque `next` no se use acá. 🔎
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const body: ErrorBody = { error: { message: err.message, code: err.code } };
    if ("details" in err) body.error.details = err.details;
    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: err.flatten(),
      },
    } satisfies ErrorBody);
    return;
  }

  // Errores de constraint de Prisma (unique, FK) también se normalizan a la
  // misma forma en vez de filtrar el mensaje crudo de Postgres al cliente. 🔎
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        error: { message: "Resource already exists", code: "CONFLICT" },
      } satisfies ErrorBody);
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({
        error: { message: "Resource not found", code: "NOT_FOUND" },
      } satisfies ErrorBody);
      return;
    }
  }

  console.error(err);
  res.status(500).json({
    error: { message: "Internal server error", code: "INTERNAL_ERROR" },
  } satisfies ErrorBody);
}
