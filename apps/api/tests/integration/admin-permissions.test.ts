import { beforeEach, describe, expect, it } from "vitest";
import { api, createAdminAgent, createClientAgent, createProduct, resetDb } from "./helpers.js";

beforeEach(resetDb);

describe("permisos y CRUD de admin", () => {
  it("el catálogo es público", async () => {
    await createProduct();
    const res = await api().get("/api/products").expect(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("sin sesión: 401; con rol CLIENTE: 403", async () => {
    const body = { name: "Cat", slug: "cat" };
    await api().post("/api/categories").send(body).expect(401);
    const client = await createClientAgent();
    await client.post("/api/categories").send(body).expect(403);
  });

  it("un ADMIN crea categoría y producto, ajusta stock y los borra", async () => {
    const admin = await createAdminAgent();
    const cat = await admin.post("/api/categories").send({ name: "Libros", slug: "libros" }).expect(201);

    const prod = await admin
      .post("/api/products")
      .send({ name: "Libro", description: "Uno", price: 1500.5, stock: 3, categoryId: cat.body.data.id })
      .expect(201);
    const id = prod.body.data.id;

    await admin.patch(`/api/products/${id}/stock`).send({ stock: 8 }).expect(200);
    const got = await api().get(`/api/products/${id}`).expect(200);
    expect(got.body.data.stock).toBe(8);

    await admin.delete(`/api/products/${id}`).expect(204);
    await api().get(`/api/products/${id}`).expect(404);
  });

  it("valida el body con el formato de error unificado", async () => {
    const admin = await createAdminAgent();
    const res = await admin.post("/api/products").send({ name: "" }).expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
