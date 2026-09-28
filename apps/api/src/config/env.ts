import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("2h"),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  MP_ACCESS_TOKEN: z.string().min(1),
  MP_WEBHOOK_SECRET: z.string().min(1),
  // URL pública completa del webhook (ej. de ngrok) para que MercadoPago
  // pueda avisar cuándo se confirma un pago. En local, mientras no haya un
  // túnel real, cualquier URL válida alcanza para que la API arranque y se
  // pueda probar todo lo anterior al webhook.
  MP_NOTIFICATION_URL: z.string().url(),
});

// Falla al arrancar si falta o está mal una env var, en vez de fallar más
// tarde a mitad de un request con un error críptico.
export const env = envSchema.parse(process.env);
