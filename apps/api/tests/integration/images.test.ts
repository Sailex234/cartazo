import sharp from "sharp";
import { beforeEach, describe, expect, it } from "vitest";
import { api, createAdminAgent, createClientAgent, createProduct, resetDb } from "./helpers.js";

beforeEach(resetDb);

// Una imagen real (más grande que el máximo) para comprobar que la API la achica.
const bigPng = () =>
  sharp({ create: { width: 1600, height: 1200, channels: 3, background: "#e30613" } }).png().toBuffer();

describe("foto de producto", () => {
  it("un ADMIN sube una foto: se achica a WebP, se sirve pública y se puede quitar", async () => {
    const admin = await createAdminAgent();
    const product = await createProduct();

    const up = await admin
      .put(`/api/products/${product.id}/image`)
      .attach("image", await bigPng(), { filename: "foto.png", contentType: "image/png" })
      .expect(200);
    expect(up.body.data.imageUrl).toMatch(new RegExp(`^/api/products/${product.id}/image\\?v=\\d+$`));

    // pública: sin sesión
    const img = await api()
      .get(`/api/products/${product.id}/image`)
      .buffer(true)
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => cb(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(img.headers["content-type"]).toBe("image/webp");
    const meta = await sharp(img.body as Buffer).metadata();
    expect(meta.format).toBe("webp");
    expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBeLessThanOrEqual(800);

    const del = await admin.delete(`/api/products/${product.id}/image`).expect(200);
    expect(del.body.data.imageUrl).toBeNull();
    await api().get(`/api/products/${product.id}/image`).expect(404);
  });

  it("exige rol ADMIN para subir y borrar", async () => {
    const product = await createProduct();
    const png = await bigPng();
    await api().put(`/api/products/${product.id}/image`).attach("image", png, "f.png").expect(401);
    const client = await createClientAgent();
    await client.put(`/api/products/${product.id}/image`).attach("image", png, "f.png").expect(403);
    await client.delete(`/api/products/${product.id}/image`).expect(403);
  });

  it("rechaza lo que no es una imagen, lo que pesa más de 2 MB y un pedido sin archivo", async () => {
    const admin = await createAdminAgent();
    const product = await createProduct();
    const url = `/api/products/${product.id}/image`;

    // el cliente dice que es PNG, pero el contenido es texto
    const fake = await admin.put(url).attach("image", Buffer.from("no soy una imagen"), { filename: "a.png", contentType: "image/png" }).expect(400);
    expect(fake.body.error.code).toBe("VALIDATION_ERROR");

    const huge = await admin.put(url).attach("image", Buffer.alloc(2 * 1024 * 1024 + 1), "big.png").expect(400);
    expect(huge.body.error.message).toMatch(/2 MB/);

    await admin.put(url).expect(400);
  });

  it("un producto inexistente da 404", async () => {
    const admin = await createAdminAgent();
    await admin
      .put("/api/products/00000000-0000-0000-0000-00000000dead/image")
      .attach("image", await bigPng(), "f.png")
      .expect(404);
  });
});
