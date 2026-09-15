import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
});

// Falla al arrancar si falta o está mal una env var, en vez de fallar más
// tarde a mitad de un request con un error críptico.
export const env = envSchema.parse(process.env);
