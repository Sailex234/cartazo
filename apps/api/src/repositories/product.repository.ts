import type { Prisma, Product, ProductImage } from "@prisma/client";
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

  // Sube la foto y apunta imageUrl a ella en una sola transacción. `?v=` cambia en cada subida
  // para que el navegador no muestre la foto vieja (la respuesta se cachea "para siempre").
  setImage(id: string, image: { data: Buffer; contentType: string }): Promise<Product> {
    const imageUrl = `/api/products/${id}/image?v=${Date.now()}`;
    // Prisma 7 tipa las columnas Bytes como Uint8Array<ArrayBuffer>; el Buffer de sharp es más amplio.
    const payload = { data: new Uint8Array(image.data), contentType: image.contentType };
    return prisma.$transaction(async (tx) => {
      await tx.productImage.upsert({
        where: { productId: id },
        create: { productId: id, ...payload },
        update: payload,
      });
      return tx.product.update({ where: { id }, data: { imageUrl } });
    });
  },

  removeImage(id: string): Promise<Product> {
    return prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: id } });
      return tx.product.update({ where: { id }, data: { imageUrl: null } });
    });
  },

  findImage(id: string): Promise<ProductImage | null> {
    return prisma.productImage.findUnique({ where: { productId: id } });
  },

  delete(id: string): Promise<Product> {
    return prisma.product.delete({ where: { id } });
  },
};
