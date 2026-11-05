import { beforeEach, describe, expect, it, vi } from "vitest";

// MercadoPago es externo: se mockea el cliente, el resto (Express, Prisma,
// Postgres) corre de verdad.
vi.mock("../../src/lib/mercadopago.js", () => ({
  mpPreferenceClient: { create: vi.fn() },
  mpPaymentClient: { get: vi.fn(), search: vi.fn() },
}));

import { mpPaymentClient, mpPreferenceClient } from "../../src/lib/mercadopago.js";
import { prisma } from "../../src/lib/prisma.js";
import { api, createClientAgent, createProduct, resetDb } from "./helpers.js";

const preferenceCreate = vi.mocked(mpPreferenceClient.create);
const paymentGet = vi.mocked(mpPaymentClient.get);
const paymentSearch = vi.mocked(mpPaymentClient.search);

beforeEach(async () => {
  await resetDb();
  vi.clearAllMocks();
  preferenceCreate.mockResolvedValue({ id: "pref-1", init_point: "https://mp.test/checkout" } as never);
  paymentSearch.mockResolvedValue({ results: [] } as never);
});

async function checkoutWith(quantity: number, stock = 10) {
  const product = await createProduct({ stock, price: 250 });
  const client = await createClientAgent();
  await client.post("/api/cart/items").send({ productId: product.id, quantity }).expect(201);
  return { product, client };
}

describe("carrito y checkout", () => {
  it("el carrito requiere sesión", async () => {
    await api().get("/api/cart").expect(401);
  });

  it("checkout crea una orden PENDING con el total y devuelve la URL de pago", async () => {
    const { client, product } = await checkoutWith(2);

    const res = await client.post("/api/orders/checkout").expect(201);
    expect(res.body.data.checkoutUrl).toBe("https://mp.test/checkout");

    const order = await prisma.order.findUniqueOrThrow({ where: { id: res.body.data.orderId } });
    expect(order.status).toBe("PENDING");
    expect(order.total.toNumber()).toBe(500);
    expect(order.mpPreferenceId).toBe("pref-1");

    // El stock NO se descuenta hasta que el pago se confirma.
    const fresh = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(fresh.stock).toBe(10);
  });

  it("rechaza checkout con carrito vacío o sin stock suficiente", async () => {
    const empty = await createClientAgent("vacio@test.com");
    await empty.post("/api/orders/checkout").expect(400);

    const { client, product } = await checkoutWith(3);
    await prisma.product.update({ where: { id: product.id }, data: { stock: 1 } });
    await client.post("/api/orders/checkout").expect(400);
  });

  it("un usuario no puede ver la orden de otro (404)", async () => {
    const { client } = await checkoutWith(1);
    const { body } = await client.post("/api/orders/checkout").expect(201);

    const other = await createClientAgent("otro@test.com");
    await other.get(`/api/orders/${body.data.orderId}`).expect(404);
  });
});

describe("webhook de MercadoPago", () => {
  it("un pago aprobado marca la orden PAID, descuenta stock y es idempotente", async () => {
    const { client, product } = await checkoutWith(2);
    const { body } = await client.post("/api/orders/checkout").expect(201);
    paymentGet.mockResolvedValue({ status: "approved", external_reference: body.data.orderId } as never);

    const notify = () => api().post("/api/webhooks/mercadopago?type=payment&data.id=123").expect(200);
    await notify();
    await notify(); // MP reenvía avisos: no debe descontar dos veces

    const order = await prisma.order.findUniqueOrThrow({ where: { id: body.data.orderId } });
    expect(order.status).toBe("PAID");
    const fresh = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(fresh.stock).toBe(8);
  });

  it("un pago rechazado cancela la orden sin tocar el stock", async () => {
    const { client, product } = await checkoutWith(2);
    const { body } = await client.post("/api/orders/checkout").expect(201);
    paymentGet.mockResolvedValue({ status: "rejected", external_reference: body.data.orderId } as never);

    await api().post("/api/webhooks/mercadopago?type=payment&data.id=124").expect(200);

    const order = await prisma.order.findUniqueOrThrow({ where: { id: body.data.orderId } });
    expect(order.status).toBe("CANCELLED");
    const fresh = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(fresh.stock).toBe(10);
  });

  it("ignora eventos que no son de pago con 200", async () => {
    await api().post("/api/webhooks/mercadopago?type=merchant_order&data.id=1").expect(200);
    expect(paymentGet).not.toHaveBeenCalled();
  });
});
