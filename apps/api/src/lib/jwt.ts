import jwt from "jsonwebtoken";
import type { Role } from "@cartazo/shared";
import { env } from "../config/env.js";

export interface JwtPayload {
  userId: string;
  role: Role;
}

export function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
