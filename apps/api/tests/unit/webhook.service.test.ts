import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("../../src/repositories/order.repository.js", () => ({
  orderRepository: {
    findById: vi.fn(),
    fulfillPayment: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock("../../src/lib/mercadopago.js", () => ({
  mpPaymentClient: { get: vi.fn(), search: vi.fn() },
}));

const { orderRepository } = await import("../../src/repositories/order.repository.js");
const { mpPaymentClient } = await import("../../src/lib/mercadopago.js");
const { webhookService } = await import("../../src/services/webhook.service.js");

const basePendingOrder = {
  id: "order-1",
  userId: "user-1",
  status: "PENDING" as const,
  total: new Prisma.Decimal(200),
  mpPreferenceId: "pref-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [
    {
      id: "oi-1",
      orderId: "order-1",
      productId: "prod-1",
      quantity: 2,
      unitPrice: new Prisma.Decimal(100),
      createdAt: new Date(),
      product: { id: "prod-1", stock: 5 },
    },
  ],
};

describe("webhookService.handlePaymentNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks the order as PAID and decrements stock when the payment is approved", async () => {
    vi.mocked(mpPaymentClient.get).mockResolvedValue({
      status: "approved",
      external_reference: "order-1",
    } as never);
    vi.mocked(orderRepository.findById).mockResolvedValue(basePendingOrder as never);

    await webhookService.handlePaymentNotification("payment-1");

    expect(orderRepository.fulfillPayment).toHaveBeenCalledWith(basePendingOrder);
    expect(orderRepository.updateStatus).not.toHaveBeenCalled();
  });

  it("marks the order as CANCELLED when the payment is rejected", async () => {
    vi.mocked(mpPaymentClient.get).mockResolvedValue({
      status: "rejected",
      external_reference: "order-1",
    } as never);
    vi.mocked(orderRepository.findById).mockResolvedValue(basePendingOrder as never);

    await webhookService.handlePaymentNotification("payment-1");

    expect(orderRepository.updateStatus).toHaveBeenCalledWith("order-1", "CANCELLED");
    expect(orderRepository.fulfillPayment).not.toHaveBeenCalled();
  });

  it("is a no-op when the order already left PENDING (reprocessed notification)", async () => {
    vi.mocked(mpPaymentClient.get).mockResolvedValue({
      status: "approved",
      external_reference: "order-1",
    } as never);
    vi.mocked(orderRepository.findById).mockResolvedValue({
      ...basePendingOrder,
      status: "PAID",
    } as never);

    await webhookService.handlePaymentNotification("payment-1");

    expect(orderRepository.fulfillPayment).not.toHaveBeenCalled();
  });

  it("is a no-op when the payment has no matching order", async () => {
    vi.mocked(mpPaymentClient.get).mockResolvedValue({
      status: "approved",
      external_reference: "missing-order",
    } as never);
    vi.mocked(orderRepository.findById).mockResolvedValue(null);

    await webhookService.handlePaymentNotification("payment-1");

    expect(orderRepository.fulfillPayment).not.toHaveBeenCalled();
    expect(orderRepository.updateStatus).not.toHaveBeenCalled();
  });

  it("is a no-op when MercadoPago does not know the payment (404)", async () => {
    vi.mocked(mpPaymentClient.get).mockRejectedValue({ status: 404 });

    await expect(webhookService.handlePaymentNotification("fake")).resolves.toBeUndefined();

    expect(orderRepository.fulfillPayment).not.toHaveBeenCalled();
  });

  it("rethrows other MercadoPago errors so the notification is retried", async () => {
    vi.mocked(mpPaymentClient.get).mockRejectedValue({ status: 500 });

    await expect(webhookService.handlePaymentNotification("payment-1")).rejects.toEqual({ status: 500 });
  });
});

describe("webhookService.reconcileOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fulfills the order when MercadoPago has an approved payment for it", async () => {
    vi.mocked(mpPaymentClient.search).mockResolvedValue({
      results: [{ status: "approved", external_reference: "order-1" }],
    } as never);
    vi.mocked(orderRepository.findById).mockResolvedValue(basePendingOrder as never);

    await webhookService.reconcileOrder("order-1");

    expect(mpPaymentClient.search).toHaveBeenCalledWith({ options: { external_reference: "order-1" } });
    expect(orderRepository.fulfillPayment).toHaveBeenCalledWith(basePendingOrder);
  });

  it("does not cancel an order that has an approved payment after a rejected attempt", async () => {
    vi.mocked(mpPaymentClient.search).mockResolvedValue({
      results: [
        { status: "rejected", external_reference: "order-1" },
        { status: "approved", external_reference: "order-1" },
      ],
    } as never);
    vi.mocked(orderRepository.findById)
      .mockResolvedValueOnce(basePendingOrder as never)
      .mockResolvedValueOnce({ ...basePendingOrder, status: "PAID" } as never);

    await webhookService.reconcileOrder("order-1");

    expect(orderRepository.fulfillPayment).toHaveBeenCalledTimes(1);
    expect(orderRepository.updateStatus).not.toHaveBeenCalled();
  });

  it("does nothing when MercadoPago has no payments for the order", async () => {
    vi.mocked(mpPaymentClient.search).mockResolvedValue({ results: [] } as never);

    await webhookService.reconcileOrder("order-1");

    expect(orderRepository.fulfillPayment).not.toHaveBeenCalled();
    expect(orderRepository.updateStatus).not.toHaveBeenCalled();
  });
});
