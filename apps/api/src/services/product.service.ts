import type { Product } from "@prisma/client";
import type { CreateProductInput, ProductQuery, UpdateProductInput } from "@cartazo/shared";
import { productRepository, type PaginatedResult } from "../repositories/product.repository.js";
import { categoryRepository } from "../repositories/category.repository.js";
import { orderRepository } from "../repositories/order.repository.js";
import { ConflictError, NotFoundError, ValidationError } from "../errors/AppError.js";

async function findByIdOrThrow(id: string): Promise<Product> {
  const product = await productRepository.findById(id);
  if (!product) throw new NotFoundError(`Product ${id} not found`);
  return product;
}

async function assertCategoryExists(categoryId: string): Promise<void> {
  const category = await categoryRepository.findById(categoryId);
  if (!category) throw new ValidationError(`Category ${categoryId} does not exist`);
}

export const productService = {
  findMany: (query: ProductQuery): Promise<PaginatedResult<Product>> =>
    productRepository.findMany(query),
  findById: findByIdOrThrow,

  async create(data: CreateProductInput): Promise<Product> {
    await assertCategoryExists(data.categoryId);
    return productRepository.create(data);
  },

  async update(id: string, data: UpdateProductInput): Promise<Product> {
    await findByIdOrThrow(id);
    if (data.categoryId) await assertCategoryExists(data.categoryId);
    return productRepository.update(id, data);
  },

  async updateStock(id: string, stock: number): Promise<Product> {
    await findByIdOrThrow(id);
    return productRepository.updateStock(id, stock);
  },

  async remove(id: string): Promise<void> {
    await findByIdOrThrow(id);
    // Preserva el historial de compras real -- mismo patrón que
    // category.service.ts usa contra productRepository para no borrar una
    // categoría con productos.
    const hasOrders = await orderRepository.existsForProduct(id);
    if (hasOrders) {
      throw new ConflictError("Cannot delete a product that has order history");
    }
    await productRepository.delete(id);
  },
};
