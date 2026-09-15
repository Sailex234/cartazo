import type { NextFunction, Request, Response } from "express";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// Express 4 no atrapa rejections de promesas en route handlers async —
// sin esto, un throw en un controller async cuelga el request en vez de
// llegar al errorHandler. 🔎
export function catchAsync(handler: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
}
