import type { Category } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "@cartazo/shared";

export const categoryRepository = {
  findAll(): Promise<Category[]> {
    return prisma.category.findMany({ orderBy: { name: "asc" } });
  },

  findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id } });
  },

  create(data: CreateCategoryInput): Promise<Category> {
    return prisma.category.create({ data });
  },

  update(id: string, data: UpdateCategoryInput): Promise<Category> {
    return prisma.category.update({ where: { id }, data });
  },

  delete(id: string): Promise<Category> {
    return prisma.category.delete({ where: { id } });
  },
};
