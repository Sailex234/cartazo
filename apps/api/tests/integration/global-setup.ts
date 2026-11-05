import { execSync } from "node:child_process";

// Aplica las migraciones a la base de test antes de correr cualquier test.
export default function setup(): void {
  const url = process.env.TEST_DATABASE_URL!;
  if (!new URL(url).pathname.endsWith("_test")) {
    // Red de seguridad: los tests borran tablas, jamás deben apuntar a la base real.
    throw new Error(`Los tests de integración exigen una base que termine en "_test" (recibido: ${url})`);
  }
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
}
