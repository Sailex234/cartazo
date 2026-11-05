import { beforeEach, describe, expect, it } from "vitest";
import { api, createClientAgent, resetDb } from "./helpers.js";

beforeEach(resetDb);

describe("auth", () => {
  it("registra un usuario CLIENTE y deja la cookie httpOnly", async () => {
    const res = await api()
      .post("/api/auth/register")
      .send({ email: "a@test.com", password: "password123", name: "A" })
      .expect(201);

    expect(res.body.data).toMatchObject({ email: "a@test.com", role: "CLIENTE" });
    expect(res.body.data.passwordHash).toBeUndefined();
    expect(res.headers["set-cookie"]?.[0]).toMatch(/HttpOnly/i);
  });

  it("no permite elegir rol ADMIN al registrarse", async () => {
    const res = await api()
      .post("/api/auth/register")
      .send({ email: "evil@test.com", password: "password123", name: "E", role: "ADMIN" })
      .expect(201);
    expect(res.body.data.role).toBe("CLIENTE");
  });

  it("rechaza un email duplicado con 409", async () => {
    await createClientAgent("dup@test.com");
    await api()
      .post("/api/auth/register")
      .send({ email: "dup@test.com", password: "password123", name: "D" })
      .expect(409);
  });

  it("rechaza credenciales inválidas con 401", async () => {
    await createClientAgent("x@test.com");
    await api().post("/api/auth/login").send({ email: "x@test.com", password: "mala-clave" }).expect(401);
  });

  it("/me devuelve el usuario con sesión y 401 sin ella", async () => {
    const agent = await createClientAgent();
    const res = await agent.get("/api/auth/me").expect(200);
    expect(res.body.data.email).toBe("cliente@test.com");
    await api().get("/api/auth/me").expect(401);
  });

  it("logout invalida la sesión del lado del cliente", async () => {
    const agent = await createClientAgent();
    await agent.post("/api/auth/logout").expect(204);
    await agent.get("/api/auth/me").expect(401);
  });
});
