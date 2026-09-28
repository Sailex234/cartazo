import { orderRepository } from "../repositories/order.repository.js";
import { mpPaymentClient } from "../lib/mercadopago.js";

export const webhookService = {
  async handlePaymentNotification(paymentId: string): Promise<void> {
    const payment = await mpPaymentClient.get({ id: paymentId });
    const orderId = payment.external_reference;
    if (!orderId) return;

    const order = await orderRepository.findById(orderId);
    // Idempotente a propósito: MercadoPago puede reenviar la misma
    // notificación más de una vez, y una orden que ya salió de PENDING no
    // se vuelve a procesar.
    if (!order || order.status !== "PENDING") return;

    if (payment.status === "approved") {
      await orderRepository.fulfillPayment(order);
    } else if (payment.status === "rejected" || payment.status === "cancelled") {
      await orderRepository.updateStatus(order.id, "CANCELLED");
    }
  },
};
