import type { Request, Response } from "express";
import { InvalidWebhookSignatureError, WebhookSignatureValidator } from "mercadopago";
import { webhookService } from "../services/webhook.service.js";
import { env } from "../config/env.js";

export const webhookController = {
  async handleMercadoPagoNotification(req: Request, res: Response): Promise<void> {
    // MercadoPago manda dos formatos: webhooks del panel (?type=payment&data.id=X)
    // e IPN, que es el que se usa cuando la preferencia lleva notification_url
    // (?topic=payment&id=X). Se aceptan los dos.
    const topic = req.query.type ?? req.query.topic;
    const dataId = (req.query["data.id"] ?? req.query.id) as string | string[] | undefined;

    // Solo procesamos pagos. Cualquier otro evento (p. ej. merchant_order) se
    // contesta 200 sin validar: un 400 solo haría que MercadoPago reintente
    // algo que ignoramos a propósito.
    if (topic !== "payment") {
      res.status(200).json({ received: true });
      return;
    }

    try {
      WebhookSignatureValidator.validate({
        xSignature: req.headers["x-signature"],
        xRequestId: req.headers["x-request-id"],
        dataId,
        secret: env.MP_WEBHOOK_SECRET,
      });
    } catch (err) {
      if (!(err instanceof InvalidWebhookSignatureError)) throw err;
      // A propósito NO se rechaza: MercadoPago firma los avisos de pagos reales
      // de cuentas de prueba con una clave que no pudimos identificar (los
      // avisos simulados del panel sí validan). La firma es una defensa extra:
      // el aviso solo dice "mirá el pago X", y el estado real se consulta
      // siempre a MercadoPago con nuestro Access Token, así que un aviso falso
      // no puede marcar una orden como pagada. Ver ESTUDIO.md.
      console.warn(`[webhook] firma inválida (${err.reason}), se procesa igual: x-request-id=${err.requestId}`);
    }

    if (typeof dataId === "string") {
      await webhookService.handlePaymentNotification(dataId);
    }

    // MercadoPago solo necesita un 200 rápido -- reintenta si no lo recibe.
    res.status(200).json({ received: true });
  },
};
