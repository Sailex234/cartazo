import bcrypt from "bcrypt";
import type { User } from "@prisma/client";
import type { LoginInput, PublicUser, RegisterInput } from "@cartazo/shared";
import { userRepository } from "../repositories/user.repository.js";
import { signJwt } from "../lib/jwt.js";
import { ConflictError, NotFoundError, UnauthorizedError } from "../errors/AppError.js";

const SALT_ROUNDS = 10;

function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

interface AuthResult {
  user: PublicUser;
  token: string;
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw new ConflictError("Email already registered");

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await userRepository.create({
      email: input.email,
      passwordHash,
      name: input.name,
    });

    const token = signJwt({ userId: user.id, role: user.role });
    return { user: toPublicUser(user), token };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await userRepository.findByEmail(input.email);
    // Mismo mensaje de error para email inexistente o password incorrecta —
    // no darle a un atacante pistas de qué emails están registrados. 🔎
    if (!user) throw new UnauthorizedError("Invalid credentials");

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) throw new UnauthorizedError("Invalid credentials");

    const token = signJwt({ userId: user.id, role: user.role });
    return { user: toPublicUser(user), token };
  },

  async me(userId: string): Promise<PublicUser> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    return toPublicUser(user);
  },
};
