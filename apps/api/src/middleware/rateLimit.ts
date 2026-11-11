import { rateLimit } from "express-rate-limit";
import { env } from "../config/env.js";

// Mismo formato de error que el resto de la API ({ error: { code, message } }).
const handler = {
  error: { code: "TOO_MANY_REQUESTS", message: "Demasiados intentos. Probá de nuevo en unos minutos." },
};

const make = (limit: number, windowMinutes: number) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: handler,
    // En los tests de integración no se limita: todos los requests salen de la misma IP.
    skip: () => env.NODE_ENV === "test",
  });

// Tope general por IP para toda la API.
export const generalLimiter = make(300, 15);
// Login/registro: frena la fuerza bruta de contraseñas y el spam de cuentas.
export const authLimiter = make(20, 15);
// Subida de fotos: es lo más caro del servidor (sharp) y lo que más almacenamiento ocupa.
export const uploadLimiter = make(30, 15);
