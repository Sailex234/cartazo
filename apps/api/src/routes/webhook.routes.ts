import { Router } from "express";
import { webhookController } from "../controllers/webhook.controller.js";
import { catchAsync } from "../middleware/catchAsync.js";

export const webhookRouter = Router();

// Sin requireAuth: quien llama es MercadoPago, no un usuario nuestro -- la
// autenticidad del request se verifica con la firma (x-signature), no con
// nuestra cookie de sesión.
webhookRouter.post("/mercadopago", catchAsync(webhookController.handleMercadoPagoNotification));
