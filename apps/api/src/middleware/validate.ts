import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

interface Schemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

// Factory: parsea (no solo valida) con Zod y pisa req.body/params/query con
// el resultado ya coercido/tipado (ej. ?page=2 -> number), para que los
// controllers no vuelvan a tocar strings crudos. Errores de Zod los agarra
// el errorHandler centralizado. 🔎
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
    if (schemas.query) {
      Object.assign(req.query, schemas.query.parse(req.query));
    }
    next();
  };
}
