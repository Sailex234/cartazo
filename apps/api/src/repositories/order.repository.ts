import type { Order, OrderItem, OrderStatus, Product, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export type OrderWithItems = Order & { items: (OrderItem & { product: Product })[] };

interface OrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
}

export const orderRepository = {
  createFromCart(userId: string, items: OrderItemInput[], total: Prisma.Decimal): Promise<OrderWithItems> {
    return prisma.order.create({
      data: {
        userId,
        total,
        items: { create: items },
      },
      include: { items: { include: { product: true } } },
    });
  },

  setPreferenceId(orderId: string, mpPreferenceId: string): Promise<Order> {
    return prisma.order.update({ where: { id: orderId }, data: { mpPreferenceId } });
  },

  findManyByUser(userId: string): Promise<OrderWithItems[]> {
    return prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { items: { include: { product: true } } },
    });
  },

  findById(id: string): Promise<OrderWithItems | null> {
    return prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
  },

  updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return prisma.order.update({ where: { id }, data: { status } });
  },

  // Existencia de al menos un OrderItem para un producto -- usado por
  // product.service.ts para bloquear el borrado de productos con historial
  // de compras real (mismo patrón que category.service.ts usa contra
  // productRepository para no borrar categorías con productos).
  async existsForProduct(productId: string): Promise<boolean> {
    const item = await prisma.orderItem.findFirst({ where: { productId }, select: { id: true } });
    return item !== null;
  },

  // Transacción que cruza 3 tablas (Order, Product, CartItem) a propósito:
  // confirmar el pago, descontar stock y vaciar el carrito tienen que pasar
  // los tres juntos o ninguno. Vive acá (no repartida entre los 3
  // repositories) para no tener que pasar un cliente de transacción a mano
  // por cada uno -- una excepción puntual y documentada a "cada repository
  // solo toca su propia tabla".
  async fulfillPayment(order: OrderWithItems): Promise<void> {
    await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } }),
      ...order.items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        }),
      ),
      prisma.cartItem.deleteMany({ where: { cart: { userId: order.userId } } }),
    ]);
  },
};
