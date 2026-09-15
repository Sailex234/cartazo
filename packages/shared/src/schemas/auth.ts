import { z } from "zod";

export const roleSchema = z.enum(["ADMIN", "CLIENTE"]);
export type Role = z.infer<typeof roleSchema>;

// Forma pública de un usuario (nunca incluye passwordHash) — la misma que
// el frontend recibe de /auth/me y que el backend arma antes de responder. 🔎
export const publicUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: roleSchema,
});
export type PublicUser = z.infer<typeof publicUserSchema>;

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
  name: z.string().trim().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
