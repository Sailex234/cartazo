import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { env } from "../config/env.js";

const mpConfig = new MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN });

export const mpPreferenceClient = new Preference(mpConfig);
export const mpPaymentClient = new Payment(mpConfig);
