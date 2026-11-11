import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError, ValidationError } from "../../src/errors/AppError.js";

vi.mock("../../src/repositories/product.repository.js", () => ({
  productRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStock: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../src/repositories/category.repository.js", () => ({
  categoryRepository: {
    findById: vi.fn(),
  },
}));

vi.mock("../../src/repositories/order.repository.js", () => ({
  orderRepository: {
    existsForProduct: vi.fn(),
  },
}));

const { productRepository } = await import("../../src/repositories/product.repository.js");
const { categoryRepository } = await import("../../src/repositories/category.repository.js");
const { orderRepository } = await import("../../src/repositories/order.repository.js");
const { productService } = await import("../../src/services/product.service.js");

describe("productService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws NotFoundError when the product does not exist", async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(null);

    await expect(productService.findById("missing-id")).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when creating with a non-existent category", async () => {
    vi.mocked(categoryRepository.findById).mockResolvedValue(null);

    await expect(
      productService.create({
        name: "Test",
        description: "Test",
        price: 10,
        stock: 1,
        categoryId: "bad-category",
      }),
    ).rejects.toThrow(ValidationError);
    expect(productRepository.create).not.toHaveBeenCalled();
  });

  it("creates the product once the category is verified to exist", async () => {
    vi.mocked(categoryRepository.findById).mockResolvedValue({
      id: "cat-1",
      name: "Cat",
      slug: "cat",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(productRepository.create).mockResolvedValue({} as never);

    await productService.create({
      name: "Test",
      description: "Test",
      price: 10,
      stock: 1,
      categoryId: "cat-1",
    });

    expect(productRepository.create).toHaveBeenCalledOnce();
  });

  it("updateStock rejects when the product does not exist", async () => {
    vi.mocked(productRepository.findById).mockResolvedValue(null);

    await expect(productService.updateStock("missing-id", 5)).rejects.toThrow(NotFoundError);
    expect(productRepository.updateStock).not.toHaveBeenCalled();
  });

  it("refuses to delete a product that has order history", async () => {
    vi.mocked(productRepository.findById).mockResolvedValue({ id: "prod-1" } as never);
    vi.mocked(orderRepository.existsForProduct).mockResolvedValue(true);

    await expect(productService.remove("prod-1")).rejects.toThrow(ConflictError);
    expect(productRepository.delete).not.toHaveBeenCalled();
  });

  it("deletes a product with no order history", async () => {
    vi.mocked(productRepository.findById).mockResolvedValue({ id: "prod-1" } as never);
    vi.mocked(orderRepository.existsForProduct).mockResolvedValue(false);

    await productService.remove("prod-1");

    expect(productRepository.delete).toHaveBeenCalledWith("prod-1");
  });

  describe("compareAtPrice", () => {
    const base = { name: "T", description: "T", price: 100, stock: 1, categoryId: "c1" };

    it("rejects creating with a compareAtPrice not greater than price", async () => {
      vi.mocked(categoryRepository.findById).mockResolvedValue({ id: "c1" } as never);

      await expect(productService.create({ ...base, compareAtPrice: 100 })).rejects.toThrow(ValidationError);
      expect(productRepository.create).not.toHaveBeenCalled();
    });

    it("accepts a compareAtPrice greater than price", async () => {
      vi.mocked(categoryRepository.findById).mockResolvedValue({ id: "c1" } as never);
      vi.mocked(productRepository.create).mockResolvedValue({ id: "p1" } as never);

      await productService.create({ ...base, compareAtPrice: 150 });

      expect(productRepository.create).toHaveBeenCalled();
    });

    it("validates against the stored compareAtPrice when only price changes", async () => {
      vi.mocked(productRepository.findById).mockResolvedValue({ id: "p1", price: "100.00", compareAtPrice: "120.00" } as never);

      await expect(productService.update("p1", { price: 130 })).rejects.toThrow(ValidationError);
    });

    it("allows clearing compareAtPrice with null", async () => {
      vi.mocked(productRepository.findById).mockResolvedValue({ id: "p1", price: "100.00", compareAtPrice: "120.00" } as never);
      vi.mocked(productRepository.update).mockResolvedValue({ id: "p1" } as never);

      await productService.update("p1", { compareAtPrice: null });

      expect(productRepository.update).toHaveBeenCalledWith("p1", { compareAtPrice: null });
    });
  });
});
