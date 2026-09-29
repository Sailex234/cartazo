import { orderRepository } from "../repositories/order.repository.js";
import { mpPaymentClient } from "../lib/mercadopago.js";

type MpPayment = Awaited<ReturnType<typeof mpPaymentClient.get>>;

// Aplica el estado de un pago (ya consultado a MercadoPago) a nuestra orden.
// Lo usan tanto el webhook como la reconciliación, así hay una sola regla.
async function applyPayment(payment: MpPayment): Promise<void> {
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
}

export const webhookService = {
  async handlePaymentNotification(paymentId: string): Promise<void> {
    let payment;
    try {
      payment = await mpPaymentClient.get({ id: paymentId });
    } catch (err) {
      // Un pago que MercadoPago no conoce (p. ej. la simulación del panel)
      // no se arregla reintentando: se ignora en vez de devolver un 500.
      if ((err as { status?: number }).status === 404) return;
      throw err;
    }
    await applyPayment(payment);
  },

  // Segundo camino, independiente del webhook: le pregunta a MercadoPago qué
  // pagos tiene esta orden. Cubre el caso en que el aviso se demora o nunca
  // llega. Los aprobados van primero para que un intento rechazado anterior
  // no cancele una orden que después se pagó.
  async reconcileOrder(orderId: string): Promise<void> {
    const { results } = await mpPaymentClient.search({ options: { external_reference: orderId } });
    const sorted = [...(results ?? [])].sort(
      (a, b) => Number(b.status === "approved") - Number(a.status === "approved"),
    );
    for (const payment of sorted) {
      await applyPayment(payment as MpPayment);
    }
  },
};
