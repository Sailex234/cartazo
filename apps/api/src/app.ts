import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.routes.js";
import { cartRouter } from "./routes/cart.routes.js";
import { categoryRouter } from "./routes/category.routes.js";
import { orderRouter } from "./routes/order.routes.js";
import { productRouter } from "./routes/product.routes.js";
import { webhookRouter } from "./routes/webhook.routes.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { env } from "./config/env.js";

export const app = express();

// credentials:true + origin explícito (no "*") son necesarios para que el
// browser mande/reciba la cookie httpOnly del JWT cross-origin (api en :4000,
// web en :3000). 🔎
app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/cart", cartRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/orders", orderRouter);
app.use("/api/products", productRouter);
app.use("/api/webhooks", webhookRouter);

// notFound y errorHandler van al final: Express recorre middleware en
// orden de registro, así que cualquier ruta no matcheada cae acá antes de
// llegar al error handler centralizado. 🔎
app.use(notFound);
app.use(errorHandler);
