import { parse } from "dotenv";
import { readFileSync, existsSync } from "node:fs";
import { defineConfig } from "vitest/config";

// URL de la base de test. En CI viene por TEST_DATABASE_URL; en local se
// deriva de DATABASE_URL (apps/api/.env) cambiando solo el nombre de la base,
// para no pisar nunca los datos de desarrollo.
function resolveTestDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const base =
    process.env.DATABASE_URL ??
    (existsSync(".env") ? parse(readFileSync(".env")).DATABASE_URL : undefined);
  if (!base) throw new Error("Definí TEST_DATABASE_URL o DATABASE_URL para correr los tests de integración");
  const url = new URL(base);
  url.pathname = "/cartazo_test";
  return url.toString();
}

const testDatabaseUrl = resolveTestDatabaseUrl();
// Se publica en process.env para que globalSetup (corre en el proceso
// principal) también lo vea, además de `test.env` para los workers.
process.env.TEST_DATABASE_URL = testDatabaseUrl;

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    globalSetup: ["tests/integration/global-setup.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: testDatabaseUrl,
      JWT_SECRET: "test-secret-test-secret-test-secret-123456",
      MP_ACCESS_TOKEN: "TEST-integration",
      MP_WEBHOOK_SECRET: "test-webhook-secret",
      MP_NOTIFICATION_URL: "http://localhost:4000/api/webhooks/mercadopago",
      WEB_ORIGIN: "http://localhost:3001",
    },
    // Todos los archivos comparten una sola base: en serie para que no se pisen.
    fileParallelism: false,
  },
});
