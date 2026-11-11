import {
  addCartItemSchema,
  createCategorySchema,
  createProductSchema,
  loginSchema,
  productQuerySchema,
  registerSchema,
  updateCartItemQuantitySchema,
  updateCategorySchema,
  updateProductSchema,
  updateStockSchema,
} from "@cartazo/shared";
import type { ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { COOKIE_NAME } from "../middleware/auth.middleware.js";

// Los cuerpos de request se generan desde los MISMOS schemas Zod que valida la
// API (packages/shared): si un schema cambia, la documentación cambia con él.
// Lo único escrito a mano son los paths y las formas de respuesta.
type Json = Record<string, unknown>;

function fromZod(schema: ZodTypeAny): Json {
  const out = zodToJsonSchema(schema, { target: "openApi3", $refStrategy: "none" }) as Json;
  delete out.$schema;
  return out;
}

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const body = (schema: ZodTypeAny) => ({
  required: true,
  content: { "application/json": { schema: fromZod(schema) } },
});
const data = (schema: Json) => ({
  type: "object",
  properties: { data: schema },
  required: ["data"],
});
const res = (description: string, schema?: Json) => ({
  description,
  ...(schema && { content: { "application/json": { schema } } }),
});
const errorRes = (description: string) => res(description, ref("Error"));
const uuidParam = (name: string) => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
});

const queryParams = Object.entries((fromZod(productQuerySchema).properties ?? {}) as Record<string, Json>).map(
  ([name, schema]) => ({ name, in: "query", required: false, schema }),
);

const protectedOp = { security: [{ cookieAuth: [] }] };
const adminOnly = {
  ...protectedOp,
  description: "Requiere sesión con rol **ADMIN**.",
};
const unauthorized = { 401: errorRes("Sin sesión o sesión inválida") };
const forbidden = { 403: errorRes("El usuario no tiene rol ADMIN") };
const invalid = { 400: errorRes("Validación fallida (VALIDATION_ERROR)") };
const notFound = { 404: errorRes("No existe (NOT_FOUND)") };

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Cartazo API",
    version: "1.0.0",
    description:
      "API REST de Cartazo: catálogo, carrito, órdenes y checkout con MercadoPago.\n\n" +
      `**Autenticación:** JWT en una cookie httpOnly llamada \`${COOKIE_NAME}\`. Se obtiene con \`POST /api/auth/login\` ` +
      "y el navegador la envía sola. Desde Swagger UI, hacé login y después probá los endpoints protegidos " +
      "(la cookie se reutiliza porque la UI se sirve desde el mismo origen).\n\n" +
      "**Errores:** siempre con la forma `{ error: { message, code, details? } }`.",
  },
  tags: [
    { name: "Auth" },
    { name: "Categories" },
    { name: "Products" },
    { name: "Cart" },
    { name: "Orders" },
    { name: "Webhooks" },
    { name: "Health" },
  ],
  components: {
    securitySchemes: { cookieAuth: { type: "apiKey", in: "cookie", name: COOKIE_NAME } },
    schemas: {
      Error: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["message", "code"],
            properties: {
              message: { type: "string" },
              code: { type: "string", example: "NOT_FOUND" },
              details: {},
            },
          },
        },
      },
      PublicUser: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          name: { type: "string" },
          role: { type: "string", enum: ["ADMIN", "CLIENTE"] },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          slug: { type: "string" },
        },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string" },
          price: { type: "string", description: "Decimal serializado como string", example: "1200.50" },
          compareAtPrice: { type: "string", nullable: true, description: "Precio anterior (tachado); mayor que price si hay oferta", example: "1500.00" },
          stock: { type: "integer" },
          imageUrl: {
            type: "string",
            nullable: true,
            description: "URL externa, o `/api/products/{id}/image?v=...` si la foto se subió desde el admin",
          },
          categoryId: { type: "string", format: "uuid" },
        },
      },
      CartItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          productId: { type: "string", format: "uuid" },
          quantity: { type: "integer" },
          product: ref("Product"),
        },
      },
      Cart: {
        type: "object",
        properties: { id: { type: "string", format: "uuid" }, items: { type: "array", items: ref("CartItem") } },
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          status: { type: "string", enum: ["PENDING", "PAID", "CANCELLED"] },
          total: { type: "string", example: "2500.00" },
          createdAt: { type: "string", format: "date-time" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                quantity: { type: "integer" },
                unitPrice: { type: "string", description: "Precio al momento de la compra" },
                product: ref("Product"),
              },
            },
          },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: { tags: ["Health"], summary: "Estado del servicio", responses: { 200: res("OK") } },
    },

    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Crear cuenta",
        description: "Siempre crea un usuario `CLIENTE` (no se puede elegir rol) y abre sesión.",
        requestBody: body(registerSchema),
        responses: { 201: res("Usuario creado", data(ref("PublicUser"))), ...invalid, 409: errorRes("Email ya registrado") },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar sesión",
        description: "Setea la cookie httpOnly con el JWT.",
        requestBody: body(loginSchema),
        responses: { 200: res("Sesión iniciada", data(ref("PublicUser"))), ...invalid, 401: errorRes("Credenciales inválidas") },
      },
    },
    "/api/auth/logout": {
      post: { tags: ["Auth"], summary: "Cerrar sesión", responses: { 204: res("Cookie eliminada") } },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Usuario de la sesión actual",
        ...protectedOp,
        responses: { 200: res("Usuario", data(ref("PublicUser"))), ...unauthorized },
      },
    },

    "/api/categories": {
      get: {
        tags: ["Categories"],
        summary: "Listar categorías",
        responses: { 200: res("Categorías", data({ type: "array", items: ref("Category") })) },
      },
      post: {
        tags: ["Categories"],
        summary: "Crear categoría",
        ...adminOnly,
        requestBody: body(createCategorySchema),
        responses: { 201: res("Creada", data(ref("Category"))), ...invalid, ...unauthorized, ...forbidden, 409: errorRes("Nombre o slug duplicado") },
      },
    },
    "/api/categories/{id}": {
      parameters: [uuidParam("id")],
      get: {
        tags: ["Categories"],
        summary: "Obtener una categoría",
        responses: { 200: res("Categoría", data(ref("Category"))), ...notFound },
      },
      put: {
        tags: ["Categories"],
        summary: "Editar categoría",
        ...adminOnly,
        requestBody: body(updateCategorySchema),
        responses: { 200: res("Actualizada", data(ref("Category"))), ...invalid, ...unauthorized, ...forbidden, ...notFound },
      },
      delete: {
        tags: ["Categories"],
        summary: "Borrar categoría",
        description: "Requiere rol **ADMIN**. Falla con 409 si la categoría todavía tiene productos.",
        ...protectedOp,
        responses: { 204: res("Borrada"), ...unauthorized, ...forbidden, ...notFound, 409: errorRes("La categoría tiene productos") },
      },
    },

    "/api/products": {
      get: {
        tags: ["Products"],
        summary: "Listar productos (paginado, con filtros)",
        parameters: queryParams,
        responses: {
          200: res("Página de productos", {
            type: "object",
            properties: {
              data: { type: "array", items: ref("Product") },
              meta: {
                type: "object",
                properties: { total: { type: "integer" }, page: { type: "integer" }, limit: { type: "integer" } },
              },
            },
          }),
          ...invalid,
        },
      },
      post: {
        tags: ["Products"],
        summary: "Crear producto",
        ...adminOnly,
        requestBody: body(createProductSchema),
        responses: { 201: res("Creado", data(ref("Product"))), ...invalid, ...unauthorized, ...forbidden },
      },
    },
    "/api/products/{id}": {
      parameters: [uuidParam("id")],
      get: {
        tags: ["Products"],
        summary: "Obtener un producto",
        responses: { 200: res("Producto", data(ref("Product"))), ...invalid, ...notFound },
      },
      put: {
        tags: ["Products"],
        summary: "Editar producto",
        ...adminOnly,
        requestBody: body(updateProductSchema),
        responses: { 200: res("Actualizado", data(ref("Product"))), ...invalid, ...unauthorized, ...forbidden, ...notFound },
      },
      delete: {
        tags: ["Products"],
        summary: "Borrar producto",
        description:
          "Requiere rol **ADMIN**. Falla con 409 si el producto tiene historial de compras (OrderItem); " +
          "si solo está en carritos, desaparece de ellos.",
        ...protectedOp,
        responses: { 204: res("Borrado"), ...unauthorized, ...forbidden, ...notFound, 409: errorRes("El producto tiene órdenes") },
      },
    },
    "/api/products/{id}/image": {
      parameters: [uuidParam("id")],
      get: {
        tags: ["Products"],
        summary: "Foto del producto",
        responses: {
          200: { description: "Imagen WebP", content: { "image/webp": { schema: { type: "string", format: "binary" } } } },
          ...invalid,
          ...notFound,
        },
      },
      put: {
        tags: ["Products"],
        summary: "Subir o reemplazar la foto",
        ...adminOnly,
        description:
          "Requiere rol **ADMIN**. `multipart/form-data` con el campo `image` (JPG, PNG o WebP, máx. 2 MB). " +
          "La API la achica a 800 px y la guarda como WebP en Postgres.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { type: "object", required: ["image"], properties: { image: { type: "string", format: "binary" } } },
            },
          },
        },
        responses: { 200: res("Producto con su nueva imageUrl", data(ref("Product"))), ...invalid, ...unauthorized, ...forbidden, ...notFound },
      },
      delete: {
        tags: ["Products"],
        summary: "Quitar la foto",
        ...adminOnly,
        responses: { 200: res("Producto sin imagen", data(ref("Product"))), ...invalid, ...unauthorized, ...forbidden, ...notFound },
      },
    },
    "/api/products/{id}/stock": {
      patch: {
        tags: ["Products"],
        summary: "Ajustar stock",
        ...adminOnly,
        parameters: [uuidParam("id")],
        requestBody: body(updateStockSchema),
        responses: { 200: res("Actualizado", data(ref("Product"))), ...invalid, ...unauthorized, ...forbidden, ...notFound },
      },
    },

    "/api/cart": {
      get: {
        tags: ["Cart"],
        summary: "Ver mi carrito",
        ...protectedOp,
        responses: { 200: res("Carrito", data(ref("Cart"))), ...unauthorized },
      },
      delete: {
        tags: ["Cart"],
        summary: "Vaciar mi carrito",
        ...protectedOp,
        responses: { 204: res("Vaciado"), ...unauthorized },
      },
    },
    "/api/cart/items": {
      post: {
        tags: ["Cart"],
        summary: "Agregar un producto al carrito",
        ...protectedOp,
        requestBody: body(addCartItemSchema),
        responses: { 201: res("Carrito actualizado", data(ref("Cart"))), ...invalid, ...unauthorized, ...notFound },
      },
    },
    "/api/cart/items/{productId}": {
      parameters: [uuidParam("productId")],
      patch: {
        tags: ["Cart"],
        summary: "Cambiar la cantidad de un ítem",
        ...protectedOp,
        requestBody: body(updateCartItemQuantitySchema),
        responses: { 200: res("Carrito actualizado", data(ref("Cart"))), ...invalid, ...unauthorized, ...notFound },
      },
      delete: {
        tags: ["Cart"],
        summary: "Quitar un ítem del carrito",
        ...protectedOp,
        responses: { 204: res("Quitado"), ...unauthorized, ...notFound },
      },
    },

    "/api/orders/checkout": {
      post: {
        tags: ["Orders"],
        summary: "Iniciar el pago con MercadoPago",
        description:
          "Crea una orden `PENDING` con los precios actuales y devuelve la URL de pago. " +
          "El stock se descuenta recién cuando el pago se confirma (webhook).",
        ...protectedOp,
        responses: {
          201: res(
            "Orden creada",
            data({
              type: "object",
              properties: { orderId: { type: "string", format: "uuid" }, checkoutUrl: { type: "string", format: "uri" } },
            }),
          ),
          400: errorRes("Carrito vacío o stock insuficiente"),
          ...unauthorized,
        },
      },
    },
    "/api/orders": {
      get: {
        tags: ["Orders"],
        summary: "Mis órdenes",
        ...protectedOp,
        responses: { 200: res("Órdenes", data({ type: "array", items: ref("Order") })), ...unauthorized },
      },
    },
    "/api/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Detalle de una orden mía",
        description:
          "Si la orden sigue `PENDING`, se reconcilia consultando a MercadoPago. " +
          "Una orden ajena responde 404 (no se revela que existe).",
        ...protectedOp,
        parameters: [uuidParam("id")],
        responses: { 200: res("Orden", data(ref("Order"))), ...invalid, ...unauthorized, ...notFound },
      },
    },

    "/api/webhooks/mercadopago": {
      post: {
        tags: ["Webhooks"],
        summary: "Notificación de pago de MercadoPago",
        description:
          "Lo llama MercadoPago, no un usuario. Solo procesa `type=payment`; el estado real del pago " +
          "siempre se consulta a MercadoPago, así que un aviso falso no puede marcar una orden como pagada.",
        parameters: [
          { name: "type", in: "query", schema: { type: "string", example: "payment" } },
          { name: "data.id", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: res("Recibido", { type: "object", properties: { received: { type: "boolean" } } }) },
      },
    },
  },
} as const;
