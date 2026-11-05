import bcrypt from "bcrypt";
import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

export const api = () => request(app);

// Orden de borrado respeta las FKs (hijos primero).
export async function resetDb(): Promise<void> {
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export async function createAdminAgent() {
  await prisma.user.create({
    data: {
      email: "admin@test.com",
      name: "Admin",
      role: "ADMIN",
      passwordHash: await bcrypt.hash("admin12345", 4),
    },
  });
  const agent = request.agent(app);
  await agent.post("/api/auth/login").send({ email: "admin@test.com", password: "admin12345" }).expect(200);
  return agent;
}

export async function createClientAgent(email = "cliente@test.com") {
  const agent = request.agent(app);
  await agent.post("/api/auth/register").send({ email, password: "cliente12345", name: "Cliente" }).expect(201);
  return agent;
}

export async function createProduct(overrides: { stock?: number; price?: number } = {}) {
  const category = await prisma.category.create({ data: { name: "Cat", slug: `cat-${Date.now()}-${Math.random()}` } });
  return prisma.product.create({
    data: {
      name: "Producto",
      description: "Desc",
      price: overrides.price ?? 100,
      stock: overrides.stock ?? 10,
      categoryId: category.id,
    },
  });
}
