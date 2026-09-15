import type { Request, Response } from "express";
import { categoryService } from "../services/category.service.js";

export const categoryController = {
  async list(_req: Request, res: Response): Promise<void> {
    const categories = await categoryService.findAll();
    res.json({ data: categories });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const category = await categoryService.findById(req.params.id);
    res.json({ data: category });
  },

  async create(req: Request, res: Response): Promise<void> {
    const category = await categoryService.create(req.body);
    res.status(201).json({ data: category });
  },

  async update(req: Request, res: Response): Promise<void> {
    const category = await categoryService.update(req.params.id, req.body);
    res.json({ data: category });
  },

  async remove(req: Request, res: Response): Promise<void> {
    await categoryService.remove(req.params.id);
    res.status(204).send();
  },
};
