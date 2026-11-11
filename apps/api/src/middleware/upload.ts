import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ValidationError } from "../errors/AppError.js";

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

// Memoria y no disco: el archivo se procesa y va a Postgres; no se escribe nada en el filesystem
// (en Render gratis se borraría en cada reinicio).
const single = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }).single("image");

// Multer tira sus propios errores; se traducen al formato de error unificado de la API.
export function uploadImage(req: Request, res: Response, next: NextFunction): void {
  single(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE" ? "Image must be at most 2 MB" : `Invalid upload: ${err.message}`;
      return next(new ValidationError(message));
    }
    next(err);
  });
}
