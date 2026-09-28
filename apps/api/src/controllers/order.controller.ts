import type { Request, Response } from "express";
import { orderService } from "../services/order.service.js";

export const orderController = {
  async checkout(req: Request, res: Response): Promise<void> {
    const result = await orderService.checkout(req.user!.userId);
    res.status(201).json({ data: result });
  },

  async list(req: Request, res: Response): Promise<void> {
    const orders = await orderService.findAllForUser(req.user!.userId);
    res.json({ data: orders });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const order = await orderService.findByIdForUser(req.user!.userId, req.params.id);
    res.json({ data: order });
  },
};
