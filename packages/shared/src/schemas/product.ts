import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  price: z.coerce.number().positive().multipleOf(0.01),
  // Precio anterior para mostrar el descuento. null lo borra (útil al editar).
  compareAtPrice: z.union([z.null(), z.coerce.number().positive().multipleOf(0.01)]).optional(),
  stock: z.coerce.number().int().min(0).default(0),
  // null borra la imagen. Las subidas desde el admin no pasan por acá (ver PUT /:id/image).
  imageUrl: z.string().url().nullable().optional(),
  categoryId: z.string().uuid(),
});

export const updateProductSchema = createProductSchema.partial();

export const updateStockSchema = z.object({
  stock: z.coerce.number().int().min(0),
});

export const productIdParamsSchema = z.object({
  id: z.string().uuid(),
});

// query params llegan como string desde Express; z.coerce los castea al
// tipo real y aplica los defaults de paginación en un solo lugar. 🔎
export const productQuerySchema = z.object({
  category: z.string().uuid().optional(),
  q: z.string().trim().min(1).max(100).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
