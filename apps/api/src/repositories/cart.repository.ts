import type { Cart, CartItem, Product } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export type CartWithItems = Cart & { items: (CartItem & { product: Product })[] };

export const cartRepository = {
  // upsert en vez de find-then-create: crea el carrito la primera vez que el
  // usuario toca algo, y de paso siempre devuelve los items con su producto.
  findOrCreateWithItems(userId: string): Promise<CartWithItems> {
    return prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: { items: { include: { product: true } } },
    });
  },

  upsertItem(cartId: string, productId: string, quantity: number): Promise<CartItem> {
    return prisma.cartItem.upsert({
      where: { cartId_productId: { cartId, productId } },
      update: { quantity },
      create: { cartId, productId, quantity },
    });
  },

  deleteItem(cartId: string, productId: string): Promise<CartItem> {
    return prisma.cartItem.delete({ where: { cartId_productId: { cartId, productId } } });
  },

  clear(cartId: string): Promise<{ count: number }> {
    return prisma.cartItem.deleteMany({ where: { cartId } });
  },
};
