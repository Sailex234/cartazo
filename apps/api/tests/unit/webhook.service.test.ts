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
  mpPaymentClient: { get: vi.fn() },
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
});
