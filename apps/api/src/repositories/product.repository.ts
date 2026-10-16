import type { Prisma, Product } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { CreateProductInput, ProductQuery, UpdateProductInput } from "@cartazo/shared";

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const productRepository = {
  async findMany(query: ProductQuery): Promise<PaginatedResult<Product>> {
    const where: Prisma.ProductWhereInput = {
      categoryId: query.category,
      // insensitive: "arroz" matchea "Arroz 1kg"; ILIKE '%q%' no usa índice, ok a esta escala
      name: query.q ? { contains: query.q, mode: "insensitive" } : undefined,
      price: {
        gte: query.minPrice,
        lte: query.maxPrice,
      },
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    return { items, total, page: query.page, limit: query.limit };
  },

  findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({ where: { id } });
  },

  create(data: CreateProductInput): Promise<Product> {
    return prisma.product.create({ data });
  },

  update(id: string, data: UpdateProductInput): Promise<Product> {
    return prisma.product.update({ where: { id }, data });
  },

  updateStock(id: string, stock: number): Promise<Product> {
    return prisma.product.update({ where: { id }, data: { stock } });
  },

  delete(id: string): Promise<Product> {
    return prisma.product.delete({ where: { id } });
  },
};
