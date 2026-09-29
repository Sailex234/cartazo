import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { ValidationError } from "../../src/errors/AppError.js";

vi.mock("../../src/repositories/cart.repository.js", () => ({
  cartRepository: {
    findOrCreateWithItems: vi.fn(),
  },
}));

vi.mock("../../src/repositories/order.repository.js", () => ({
  orderRepository: {
    createFromCart: vi.fn(),
    setPreferenceId: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock("../../src/services/webhook.service.js", () => ({
  webhookService: { reconcileOrder: vi.fn() },
}));

vi.mock("../../src/lib/mercadopago.js", () => ({
  mpPreferenceClient: { create: vi.fn() },
}));

const { cartRepository } = await import("../../src/repositories/cart.repository.js");
const { orderRepository } = await import("../../src/repositories/order.repository.js");
const { mpPreferenceClient } = await import("../../src/lib/mercadopago.js");
const { webhookService } = await import("../../src/services/webhook.service.js");
const { orderService } = await import("../../src/services/order.service.js");

const baseProduct = {
  id: "prod-1",
  name: "Test Product",
  description: "desc",
  price: new Prisma.Decimal(100),
  stock: 5,
  imageUrl: null,
  categoryId: "cat-1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

function cartWithOneItem(quantity: number, stock = 5) {
  return {
    id: "cart-1",
    userId: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: "item-1",
        cartId: "cart-1",
        productId: "prod-1",
        quantity,
        createdAt: new Date(),
        updatedAt: new Date(),
        product: { ...baseProduct, stock },
      },
    ],
  };
}

describe("orderService.checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects checkout with an empty cart", async () => {
    vi.mocked(cartRepository.findOrCreateWithItems).mockResolvedValue({
      id: "cart-1",
      userId: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
    } as never);

    await expect(orderService.checkout("user-1")).rejects.toThrow(ValidationError);
    expect(orderRepository.createFromCart).not.toHaveBeenCalled();
  });

  it("rejects checkout when a cart item exceeds available stock", async () => {
    vi.mocked(cartRepository.findOrCreateWithItems).mockResolvedValue(
      cartWithOneItem(10, 5) as never,
    );

    await expect(orderService.checkout("user-1")).rejects.toThrow(ValidationError);
    expect(orderRepository.createFromCart).not.toHaveBeenCalled();
  });

  it("creates the order with the correct total and returns the MercadoPago checkout URL", async () => {
    vi.mocked(cartRepository.findOrCreateWithItems).mockResolvedValue(
      cartWithOneItem(2, 5) as never,
    );
    vi.mocked(orderRepository.createFromCart).mockResolvedValue({
      id: "order-1",
      userId: "user-1",
      status: "PENDING",
      total: new Prisma.Decimal(200),
      mpPreferenceId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: "oi-1",
          orderId: "order-1",
          productId: "prod-1",
          quantity: 2,
          unitPrice: new Prisma.Decimal(100),
          createdAt: new Date(),
          product: baseProduct,
        },
      ],
    } as never);
    vi.mocked(mpPreferenceClient.create).mockResolvedValue({
      id: "pref-1",
      sandbox_init_point: "https://sandbox.mercadopago.com/pref-1",
      init_point: "https://mercadopago.com/pref-1",
    } as never);

    const result = await orderService.checkout("user-1");

    expect(orderRepository.createFromCart).toHaveBeenCalledWith(
      "user-1",
      [{ productId: "prod-1", quantity: 2, unitPrice: expect.any(Prisma.Decimal) }],
      expect.any(Prisma.Decimal),
    );
    const [, , total] = vi.mocked(orderRepository.createFromCart).mock.calls[0]!;
    expect((total as Prisma.Decimal).toNumber()).toBe(200);

    expect(orderRepository.setPreferenceId).toHaveBeenCalledWith("order-1", "pref-1");
    expect(result).toEqual({ orderId: "order-1", checkoutUrl: "https://mercadopago.com/pref-1" });
  });
});

describe("orderService.findByIdForUser", () => {
  const order = (status: string) => ({ id: "order-1", userId: "user-1", status }) as never;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reconciles a PENDING order with MercadoPago and returns the refreshed order", async () => {
    vi.mocked(orderRepository.findById)
      .mockResolvedValueOnce(order("PENDING"))
      .mockResolvedValueOnce(order("PAID"));

    const result = await orderService.findByIdForUser("user-1", "order-1");

    expect(webhookService.reconcileOrder).toHaveBeenCalledWith("order-1");
    expect(result).toMatchObject({ status: "PAID" });
  });

  it("does not call MercadoPago for an order that is no longer PENDING", async () => {
    vi.mocked(orderRepository.findById).mockResolvedValue(order("PAID"));

    await orderService.findByIdForUser("user-1", "order-1");

    expect(webhookService.reconcileOrder).not.toHaveBeenCalled();
  });

  it("returns the order as is when the MercadoPago lookup fails", async () => {
    vi.mocked(orderRepository.findById).mockResolvedValue(order("PENDING"));
    vi.mocked(webhookService.reconcileOrder).mockRejectedValue(new Error("MP down"));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await orderService.findByIdForUser("user-1", "order-1");

    expect(result).toMatchObject({ status: "PENDING" });
  });

  it("hides orders that belong to someone else", async () => {
    vi.mocked(orderRepository.findById).mockResolvedValue(order("PENDING"));

    await expect(orderService.findByIdForUser("other-user", "order-1")).rejects.toThrow("not found");
  });
});
