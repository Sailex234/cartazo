import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError } from "../../src/errors/AppError.js";

vi.mock("../../src/repositories/category.repository.js", () => ({
  categoryRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../src/repositories/product.repository.js", () => ({
  productRepository: {
    findMany: vi.fn(),
  },
}));

const { categoryRepository } = await import("../../src/repositories/category.repository.js");
const { productRepository } = await import("../../src/repositories/product.repository.js");
const { categoryService } = await import("../../src/services/category.service.js");

describe("categoryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws NotFoundError when the category does not exist", async () => {
    vi.mocked(categoryRepository.findById).mockResolvedValue(null);

    await expect(categoryService.findById("missing-id")).rejects.toThrow(NotFoundError);
  });

  it("refuses to delete a category that still has products", async () => {
    vi.mocked(categoryRepository.findById).mockResolvedValue({
      id: "cat-1",
      name: "Cat",
      slug: "cat",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(productRepository.findMany).mockResolvedValue({
      items: [],
      total: 3,
      page: 1,
      limit: 1,
    });

    await expect(categoryService.remove("cat-1")).rejects.toThrow(ConflictError);
    expect(categoryRepository.delete).not.toHaveBeenCalled();
  });

  it("deletes a category with no products", async () => {
    vi.mocked(categoryRepository.findById).mockResolvedValue({
      id: "cat-1",
      name: "Cat",
      slug: "cat",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(productRepository.findMany).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 1,
    });

    await categoryService.remove("cat-1");

    expect(categoryRepository.delete).toHaveBeenCalledWith("cat-1");
  });
});
