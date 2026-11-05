import { defineConfig } from "vitest/config";

// `npm test` corre solo los unit tests (rápidos, sin base de datos).
// Los de integración tienen su propia config: vitest.integration.config.ts.
export default defineConfig({
  test: { include: ["tests/unit/**/*.test.ts"] },
});
