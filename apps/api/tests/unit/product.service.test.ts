import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError, ValidationError } from "../../src/errors/AppError.js";

vi.mock("../../src/repositories/product.repository.js", () => ({
  productRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStock: vi.fn(),
    setImage: vi.fn(),
    removeImage: vi.fn(),
    findImage: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../src/lib/image.js", () => ({
  processProductImage: vi.fn(),
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
const { processProductImage } = await import("../../src/lib/image.js");
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

  describe("imagen del producto", () => {
    it("setImage procesa el archivo y lo guarda", async () => {
      vi.mocked(productRepository.findById).mockResolvedValue({ id: "p1" } as never);
      vi.mocked(processProductImage).mockResolvedValue({ data: Buffer.from("webp"), contentType: "image/webp" });
      vi.mocked(productRepository.setImage).mockResolvedValue({ id: "p1" } as never);

      await productService.setImage("p1", Buffer.from("raw"));

      expect(processProductImage).toHaveBeenCalledWith(Buffer.from("raw"));
      expect(productRepository.setImage).toHaveBeenCalledWith("p1", { data: Buffer.from("webp"), contentType: "image/webp" });
    });

    it("setImage no toca la base si el archivo no es una imagen", async () => {
      vi.mocked(productRepository.findById).mockResolvedValue({ id: "p1" } as never);
      vi.mocked(processProductImage).mockRejectedValue(new ValidationError("File is not a valid image"));

      await expect(productService.setImage("p1", Buffer.from("x"))).rejects.toThrow(ValidationError);
      expect(productRepository.setImage).not.toHaveBeenCalled();
    });

    it("setImage y removeImage fallan con NotFoundError si el producto no existe", async () => {
      vi.mocked(productRepository.findById).mockResolvedValue(null);

      await expect(productService.setImage("x", Buffer.from("x"))).rejects.toThrow(NotFoundError);
      await expect(productService.removeImage("x")).rejects.toThrow(NotFoundError);
    });

    it("getImage falla con NotFoundError si el producto no tiene foto", async () => {
      vi.mocked(productRepository.findImage).mockResolvedValue(null);

      await expect(productService.getImage("p1")).rejects.toThrow(NotFoundError);
    });
  });
});
