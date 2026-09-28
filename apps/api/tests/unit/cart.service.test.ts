import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { NotFoundError, ValidationError } from "../../src/errors/AppError.js";

vi.mock("../../src/repositories/cart.repository.js", () => ({
  cartRepository: {
    findOrCreateWithItems: vi.fn(),
    upsertItem: vi.fn(),
    deleteItem: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock("../../src/repositories/product.repository.js", () => ({
  productRepository: {
    findById: vi.fn(),
  },
}));

const { cartRepository } = await import("../../src/repositories/cart.repository.js");
const { productRepository } = await import("../../src/repositories/product.repository.js");
const { cartService } = await import("../../src/services/cart.service.js");

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

function cartWithItems(items: { productId: string; quantity: number }[]) {
  return {
    id: "cart-1",
    userId: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    items: items.map((item, i) => ({
      id: `item-${i}`,
      cartId: "cart-1",
      productId: item.productId,
      quantity: item.quantity,
      createdAt: new Date(),
      updatedAt: new Date(),
      product: { ...baseProduct, id: item.productId },
    })),
  };
}

describe("cartService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects adding an item when there isn't enough stock", async () => {
    vi.mocked(cartRepository.findOrCreateWithItems).mockResolvedValue(cartWithItems([]) as never);
    vi.mocked(productRepository.findById).mockResolvedValue({ ...baseProduct, stock: 2 } as never);

    await expect(
      cartService.addItem("user-1", { productId: "prod-1", quantity: 5 }),
    ).rejects.toThrow(ValidationError);
    expect(cartRepository.upsertItem).not.toHaveBeenCalled();
  });

  it("sums the quantity when the product is already in the cart", async () => {
    vi.mocked(cartRepository.findOrCreateWithItems).mockResolvedValue(
      cartWithItems([{ productId: "prod-1", quantity: 2 }]) as never,
    );
    vi.mocked(productRepository.findById).mockResolvedValue({ ...baseProduct, stock: 10 } as never);

    await cartService.addItem("user-1", { productId: "prod-1", quantity: 3 });

    expect(cartRepository.upsertItem).toHaveBeenCalledWith("cart-1", "prod-1", 5);
  });

  it("updateItemQuantity rejects when the product is not in the cart", async () => {
    vi.mocked(cartRepository.findOrCreateWithItems).mockResolvedValue(cartWithItems([]) as never);

    await expect(cartService.updateItemQuantity("user-1", "prod-1", 3)).rejects.toThrow(
      NotFoundError,
    );
    expect(cartRepository.upsertItem).not.toHaveBeenCalled();
  });

  it("removeItem rejects when the product is not in the cart", async () => {
    vi.mocked(cartRepository.findOrCreateWithItems).mockResolvedValue(cartWithItems([]) as never);

    await expect(cartService.removeItem("user-1", "prod-1")).rejects.toThrow(NotFoundError);
    expect(cartRepository.deleteItem).not.toHaveBeenCalled();
  });
});
