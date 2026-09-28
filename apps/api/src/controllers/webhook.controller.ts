import type { Request, Response } from "express";
import { InvalidWebhookSignatureError, WebhookSignatureValidator } from "mercadopago";
import { webhookService } from "../services/webhook.service.js";
import { env } from "../config/env.js";
import { ValidationError } from "../errors/AppError.js";

export const webhookController = {
  async handleMercadoPagoNotification(req: Request, res: Response): Promise<void> {
    const dataId = req.query["data.id"] as string | string[] | undefined;

    try {
      WebhookSignatureValidator.validate({
        xSignature: req.headers["x-signature"],
        xRequestId: req.headers["x-request-id"],
        dataId,
        secret: env.MP_WEBHOOK_SECRET,
      });
    } catch (err) {
      if (err instanceof InvalidWebhookSignatureError) {
        throw new ValidationError("Invalid MercadoPago webhook signature");
      }
      throw err;
    }

    if (req.query.type === "payment" && typeof dataId === "string") {
      await webhookService.handlePaymentNotification(dataId);
    }

    // MercadoPago solo necesita un 200 rápido -- reintenta si no lo recibe.
    // Cualquier evento que no procesamos (topic distinto, dataId ausente)
    // igual se contesta OK para que no siga reintentando algo que ignoramos
    // a propósito.
    res.status(200).json({ received: true });
  },
};
