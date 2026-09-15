import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, UnauthorizedError } from "../../src/errors/AppError.js";

vi.mock("../../src/repositories/user.repository.js", () => ({
  userRepository: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("../../src/lib/jwt.js", () => ({
  signJwt: vi.fn(() => "signed-token"),
}));

const { userRepository } = await import("../../src/repositories/user.repository.js");
const { signJwt } = await import("../../src/lib/jwt.js");
const { authService } = await import("../../src/services/auth.service.js");

const baseUser = {
  id: "user-1",
  email: "test@cartazo.com",
  name: "Test",
  role: "CLIENTE" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects registration when the email is already taken", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue({
      ...baseUser,
      passwordHash: "hash",
    });

    await expect(
      authService.register({ email: baseUser.email, password: "password123", name: "Test" }),
    ).rejects.toThrow(ConflictError);
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it("registers a new user and never returns the password hash", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepository.create).mockResolvedValue({ ...baseUser, passwordHash: "hash" });

    const result = await authService.register({
      email: baseUser.email,
      password: "password123",
      name: "Test",
    });

    expect(result.user).not.toHaveProperty("passwordHash");
    expect(result.token).toBe("signed-token");
    expect(signJwt).toHaveBeenCalledWith({ userId: baseUser.id, role: baseUser.role });
  });

  it("rejects login for a non-existent email with a generic error", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    await expect(
      authService.login({ email: "missing@cartazo.com", password: "whatever" }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("rejects login with a wrong password", async () => {
    // hash de "correct-password" a proposito distinto de lo que se prueba
    const bcrypt = await import("bcrypt");
    const passwordHash = await bcrypt.hash("correct-password", 4);
    vi.mocked(userRepository.findByEmail).mockResolvedValue({ ...baseUser, passwordHash });

    await expect(
      authService.login({ email: baseUser.email, password: "wrong-password" }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("logs in successfully with the right password", async () => {
    const bcrypt = await import("bcrypt");
    const passwordHash = await bcrypt.hash("correct-password", 4);
    vi.mocked(userRepository.findByEmail).mockResolvedValue({ ...baseUser, passwordHash });

    const result = await authService.login({
      email: baseUser.email,
      password: "correct-password",
    });

    expect(result.user.email).toBe(baseUser.email);
    expect(result.token).toBe("signed-token");
  });
});
