"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { PublicUser } from "@cartazo/shared";
import { getMe, logout as apiLogout } from "@/lib/api";

interface AuthState {
  user: PublicUser | null;
  loading: boolean; // true hasta saber si hay sesión (evita parpadear "Ingresar")
  setUser: (user: PublicUser | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  // La cookie es httpOnly: JS no la puede leer, así que la única forma de saber
  // si hay sesión es preguntarle a la API (/auth/me) al cargar.
  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return <AuthContext value={{ user, loading, setUser, logout }}>{children}</AuthContext>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
