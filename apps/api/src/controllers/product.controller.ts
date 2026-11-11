import type { Request, Response } from "express";
import type { ProductQuery } from "@cartazo/shared";
import { ValidationError } from "../errors/AppError.js";
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

  async setImage(req: Request, res: Response): Promise<void> {
    if (!req.file) throw new ValidationError('Multipart field "image" is required');
    const product = await productService.setImage(req.params.id, req.file.buffer);
    res.json({ data: product });
  },

  async removeImage(req: Request, res: Response): Promise<void> {
    const product = await productService.removeImage(req.params.id);
    res.json({ data: product });
  },

  async getImage(req: Request, res: Response): Promise<void> {
    const image = await productService.getImage(req.params.id);
    res.setHeader("Content-Type", image.contentType);
    // La URL lleva ?v=<timestamp>, así que cada versión de la foto es inmutable y se puede cachear.
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(Buffer.from(image.data));
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
