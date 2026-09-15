import cors from "cors";
import express from "express";
import { categoryRouter } from "./routes/category.routes.js";
import { productRouter } from "./routes/product.routes.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);

// notFound y errorHandler van al final: Express recorre middleware en
// orden de registro, así que cualquier ruta no matcheada cae acá antes de
// llegar al error handler centralizado. 🔎
app.use(notFound);
app.use(errorHandler);
