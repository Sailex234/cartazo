import type { Request, Response } from "express";
import type { ProductQuery } from "@cartazo/shared";
import { productService } from "../services/product.service.js";

export const productController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await productService.findMany(req.query as unknown as ProductQuery);
    res.json({
      data: result.items,
      meta: { total: result.total, page: result.page, limit: result.limit },
    });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const product = await productService.findById(req.params.id);
    res.json({ data: product });
  },

  async create(req: Request, res: Response): Promise<void> {
    const product = await productService.create(req.body);
    res.status(201).json({ data: product });
  },

  async update(req: Request, res: Response): Promise<void> {
    const product = await productService.update(req.params.id, req.body);
    res.json({ data: product });
  },

  async updateStock(req: Request, res: Response): Promise<void> {
    const product = await productService.updateStock(req.params.id, req.body.stock);
    res.json({ data: product });
  },

  async remove(req: Request, res: Response): Promise<void> {
    await productService.remove(req.params.id);
    res.status(204).send();
  },
};
