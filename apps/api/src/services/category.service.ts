import type { Category } from "@prisma/client";
import type { CreateCategoryInput, UpdateCategoryInput } from "@cartazo/shared";
import { categoryRepository } from "../repositories/category.repository.js";
import { productRepository } from "../repositories/product.repository.js";
import { ConflictError, NotFoundError } from "../errors/AppError.js";

async function findByIdOrThrow(id: string): Promise<Category> {
  const category = await categoryRepository.findById(id);
  if (!category) throw new NotFoundError(`Category ${id} not found`);
  return category;
}

export const categoryService = {
  findAll: categoryRepository.findAll,
  findById: findByIdOrThrow,
  create: (data: CreateCategoryInput) => categoryRepository.create(data),

  async update(id: string, data: UpdateCategoryInput): Promise<Category> {
    await findByIdOrThrow(id);
    return categoryRepository.update(id, data);
  },

  async remove(id: string): Promise<void> {
    await findByIdOrThrow(id);
    // Chequeo explícito en vez de dejar que la FK constraint de Postgres
    // tire un error críptico — así el cliente recibe un 409 claro. 🔎
    const { total } = await productRepository.findMany({
      category: id,
      page: 1,
      limit: 1,
    });
    if (total > 0) {
      throw new ConflictError("Cannot delete a category that still has products");
    }
    await categoryRepository.delete(id);
  },
};
