import type { Router } from "express";
import { describe, expect, it } from "vitest";
import { openApiSpec } from "../../src/docs/openapi.js";
import { authRouter } from "../../src/routes/auth.routes.js";
import { cartRouter } from "../../src/routes/cart.routes.js";
import { categoryRouter } from "../../src/routes/category.routes.js";
import { orderRouter } from "../../src/routes/order.routes.js";
import { productRouter } from "../../src/routes/product.routes.js";
import { webhookRouter } from "../../src/routes/webhook.routes.js";
import { api } from "./helpers.js";

// Prefijos con los que app.ts monta cada router.
const mounts: [string, Router][] = [
  ["/api/auth", authRouter],
  ["/api/cart", cartRouter],
  ["/api/categories", categoryRouter],
  ["/api/orders", orderRouter],
  ["/api/products", productRouter],
  ["/api/webhooks", webhookRouter],
];

// Lista "METHOD /ruta/{param}" de todo lo que Express tiene registrado.
function realEndpoints(): string[] {
  const out: string[] = [];
  for (const [prefix, router] of mounts) {
    for (const layer of router.stack) {
      if (!layer.route) continue; // middleware (router.use), no es un endpoint
      const path = (prefix + layer.route.path).replace(/\/$/, "").replace(/:(\w+)/g, "{$1}");
      for (const method of Object.keys(layer.route.methods)) out.push(`${method.toUpperCase()} ${path}`);
    }
  }
  return out;
}

function documentedEndpoints(): string[] {
  const out: string[] = [];
  for (const [path, item] of Object.entries(openApiSpec.paths)) {
    if (path === "/health") continue;
    for (const method of ["get", "post", "put", "patch", "delete"]) {
      if (method in item) out.push(`${method.toUpperCase()} ${path}`);
    }
  }
  return out;
}

describe("documentación OpenAPI", () => {
  it("documenta exactamente los endpoints que existen (sin faltantes ni sobrantes)", () => {
    expect(documentedEndpoints().sort()).toEqual(realEndpoints().sort());
  });

  it("sirve la spec en JSON y la UI de Swagger", async () => {
    const json = await api().get("/api/docs.json").expect(200);
    expect(json.body.openapi).toMatch(/^3\./);
    const ui = await api().get("/api/docs/").expect(200);
    expect(ui.text).toContain("swagger-ui");
  });
});
