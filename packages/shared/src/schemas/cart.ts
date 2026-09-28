import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
});

// Bajar a 0 es un DELETE, no un PATCH -- por eso .positive(), no .min(0).
export const updateCartItemQuantitySchema = z.object({
  quantity: z.coerce.number().int().positive(),
});

export const cartItemParamsSchema = z.object({
  productId: z.string().uuid(),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemQuantityInput = z.infer<typeof updateCartItemQuantitySchema>;
