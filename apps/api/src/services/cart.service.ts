import type { AddCartItemInput } from "@cartazo/shared";
import { cartRepository, type CartWithItems } from "../repositories/cart.repository.js";
import { productRepository } from "../repositories/product.repository.js";
import { NotFoundError, ValidationError } from "../errors/AppError.js";

async function assertStockAvailable(productId: string, quantity: number): Promise<void> {
  const product = await productRepository.findById(productId);
  if (!product) throw new NotFoundError(`Product ${productId} not found`);
  if (quantity > product.stock) {
    throw new ValidationError(`Not enough stock for "${product.name}"`);
  }
}

export const cartService = {
  getCart: (userId: string): Promise<CartWithItems> => cartRepository.findOrCreateWithItems(userId),

  async addItem(userId: string, data: AddCartItemInput): Promise<CartWithItems> {
    const cart = await cartRepository.findOrCreateWithItems(userId);
    const existing = cart.items.find((item) => item.productId === data.productId);
    const newQuantity = (existing?.quantity ?? 0) + data.quantity;

    await assertStockAvailable(data.productId, newQuantity);
    await cartRepository.upsertItem(cart.id, data.productId, newQuantity);
    return cartRepository.findOrCreateWithItems(userId);
  },

  async updateItemQuantity(userId: string, productId: string, quantity: number): Promise<CartWithItems> {
    const cart = await cartRepository.findOrCreateWithItems(userId);
    const existing = cart.items.find((item) => item.productId === productId);
    if (!existing) throw new NotFoundError(`Product ${productId} is not in the cart`);

    await assertStockAvailable(productId, quantity);
    await cartRepository.upsertItem(cart.id, productId, quantity);
    return cartRepository.findOrCreateWithItems(userId);
  },

  async removeItem(userId: string, productId: string): Promise<void> {
    const cart = await cartRepository.findOrCreateWithItems(userId);
    const existing = cart.items.find((item) => item.productId === productId);
    if (!existing) throw new NotFoundError(`Product ${productId} is not in the cart`);
    await cartRepository.deleteItem(cart.id, productId);
  },

  async clear(userId: string): Promise<void> {
    const cart = await cartRepository.findOrCreateWithItems(userId);
    await cartRepository.clear(cart.id);
  },
};
