import { Prisma } from "@prisma/client";
import { cartRepository } from "../repositories/cart.repository.js";
import { orderRepository, type OrderWithItems } from "../repositories/order.repository.js";
import { mpPreferenceClient } from "../lib/mercadopago.js";
import { env } from "../config/env.js";
import { NotFoundError, ValidationError } from "../errors/AppError.js";

interface CheckoutResult {
  orderId: string;
  checkoutUrl: string;
}

export const orderService = {
  findAllForUser: (userId: string): Promise<OrderWithItems[]> => orderRepository.findManyByUser(userId),

  async findByIdForUser(userId: string, orderId: string): Promise<OrderWithItems> {
    const order = await orderRepository.findById(orderId);
    // NotFoundError, no ForbiddenError -- no confirmarle a alguien que una
    // orden ajena existe, mismo criterio que login con credenciales inválidas.
    if (!order || order.userId !== userId) throw new NotFoundError(`Order ${orderId} not found`);
    return order;
  },

  async checkout(userId: string): Promise<CheckoutResult> {
    const cart = await cartRepository.findOrCreateWithItems(userId);
    if (cart.items.length === 0) throw new ValidationError("Cart is empty");

    for (const item of cart.items) {
      if (item.quantity > item.product.stock) {
        throw new ValidationError(`Not enough stock for "${item.product.name}"`);
      }
    }

    const total = cart.items.reduce(
      (sum, item) => sum.plus(item.product.price.mul(item.quantity)),
      new Prisma.Decimal(0),
    );

    const order = await orderRepository.createFromCart(
      userId,
      cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.product.price,
      })),
      total,
    );

    // Stock se descuenta recién cuando el pago se confirma (webhook), no
    // acá -- así un checkout abandonado no deja stock reservado para
    // siempre. Ver ESTUDIO.md para el trade-off aceptado a propósito.
    const preference = await mpPreferenceClient.create({
      body: {
        items: order.items.map((item) => ({
          id: item.productId,
          title: item.product.name,
          quantity: item.quantity,
          unit_price: item.unitPrice.toNumber(),
          currency_id: "ARS",
        })),
        back_urls: {
          success: `${env.WEB_ORIGIN}/orders/${order.id}?status=success`,
          pending: `${env.WEB_ORIGIN}/orders/${order.id}?status=pending`,
          failure: `${env.WEB_ORIGIN}/orders/${order.id}?status=failure`,
        },
        notification_url: env.MP_NOTIFICATION_URL,
        external_reference: order.id,
      },
    });

    if (preference.id) {
      await orderRepository.setPreferenceId(order.id, preference.id);
    }

    const checkoutUrl = preference.sandbox_init_point ?? preference.init_point;
    if (!checkoutUrl) {
      throw new Error("MercadoPago did not return a checkout URL");
    }

    return { orderId: order.id, checkoutUrl };
  },
};
