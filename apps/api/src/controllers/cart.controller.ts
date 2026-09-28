import type { Request, Response } from "express";
import { cartService } from "../services/cart.service.js";

export const cartController = {
  async get(req: Request, res: Response): Promise<void> {
    const cart = await cartService.getCart(req.user!.userId);
    res.json({ data: cart });
  },

  async addItem(req: Request, res: Response): Promise<void> {
    const cart = await cartService.addItem(req.user!.userId, req.body);
    res.status(201).json({ data: cart });
  },

  async updateItem(req: Request, res: Response): Promise<void> {
    const cart = await cartService.updateItemQuantity(
      req.user!.userId,
      req.params.productId,
      req.body.quantity,
    );
    res.json({ data: cart });
  },

  async removeItem(req: Request, res: Response): Promise<void> {
    await cartService.removeItem(req.user!.userId, req.params.productId);
    res.status(204).send();
  },

  async clear(req: Request, res: Response): Promise<void> {
    await cartService.clear(req.user!.userId);
    res.status(204).send();
  },
};
