# Cartazo

Tienda online full-stack: catálogo con filtros, carrito, checkout con **MercadoPago** y panel de
administración de inventario. Es un proyecto de portfolio que reemplaza por completo un CRUD de
productos en PHP plano; está reescrito desde cero en TypeScript.

<!-- Capturas: agregar acá (home, detalle, carrito, admin) en docs/screenshots/ -->

## Qué incluye

- **Catálogo** con búsqueda, filtro por categoría y precio, paginación y detalle de producto, con
  **ofertas** (precio anterior tachado y % OFF) y una identidad visual tipo supermercado de barrio.
- **Cuentas y sesión** (registro, login, logout) con roles `CLIENTE` y `ADMIN`.
- **Carrito** persistente por usuario y **checkout con MercadoPago** (modo prueba), con
  confirmación de pago por webhook y reconciliación si el aviso se demora.
- **Historial de órdenes** y estado de cada pago.
- **Panel de admin**: inventario, alta/edición/borrado de productos (con precio anterior opcional
  para armar ofertas), ajuste de stock inline y gestión de categorías.
- **API documentada** con OpenAPI/Swagger, generada desde los mismos schemas que validan los requests.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Node.js, Express, TypeScript (ESM) |
| Base de datos | PostgreSQL + Prisma 7 |
| Validación | Zod (schemas compartidos entre API y web) |
| Frontend | Next.js 16 (App Router), React, Tailwind CSS 4 |
| Pagos | MercadoPago (Checkout Pro) |
| Tests | Vitest, Supertest |
| Infra | Docker Compose (Postgres), GitHub Actions (CI) |

Monorepo con npm workspaces: `apps/api`, `apps/web` y `packages/shared`.

## Cómo correrlo

Requisitos: Node 20+ y Docker.

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env      # completar JWT_SECRET y credenciales de MercadoPago
cp apps/web/.env.example apps/web/.env.local
npm install
docker compose up -d                          # Postgres
(cd apps/api && npx prisma migrate dev)       # aplica migraciones y corre el seed
npm run dev:api                               # http://localhost:4000
npm run dev:web                               # http://localhost:3001
```

`DATABASE_URL` en `apps/api/.env` debe coincidir con `POSTGRES_*` del `.env` de la raíz.
El seed (`npx prisma db seed`, corre solo tras `migrate dev`) crea 5 categorías, 16 productos (7 en oferta) y un
admin de desarrollo: `admin@cartazo.com` / `admin12345` (**cambiar en cualquier entorno real**).

Para probar pagos hace falta un access token de prueba de MercadoPago y, para que llegue el
webhook, una URL pública (por ejemplo un túnel de ngrok) en `MP_NOTIFICATION_URL`. Sin eso el
checkout igual funciona: al volver a la orden, la API consulta el pago directamente.

## Documentación de la API

Con la API corriendo: **http://localhost:4000/api/docs** (Swagger UI) y
`/api/docs.json` (spec cruda). Los cuerpos de request se generan desde los schemas Zod de
`packages/shared`; un test falla si hay un endpoint sin documentar.

## Tests y calidad

```bash
npm test                                          # unitarios (sin base de datos)
npm run test:integration --workspace=apps/api     # integración: HTTP + Postgres real (base cartazo_test)
npm run lint && npm run build
```

Los tests de integración usan una base aparte (`cartazo_test`, creada una vez con
`CREATE DATABASE`) y mockean solo el cliente de MercadoPago. El CI
(`.github/workflows/ci.yml`) corre lint, build, unitarios e integración en cada push y PR.

## Decisiones de diseño

- **Capas en la API:** routes → controllers → services → repositories. Solo los repositories
  tocan Prisma, así los services se testean mockeando el repositorio.
- **Sesión en cookie httpOnly**, no en `localStorage`: mitiga el robo del token por XSS, a cambio
  de configurar CORS con `credentials` y un origen explícito.
- **Un solo formato de error** (`{ error: { message, code } }`) para toda la API, con un manejador
  central.
- **MercadoPago en vez de Stripe:** Stripe no admite cuentas en Argentina.
- **El stock se descuenta al confirmarse el pago**, no al iniciar el checkout, para que un pago
  abandonado no deje stock reservado. Es un trade-off aceptado a escala de proyecto.
- **El webhook nunca confía en el aviso:** siempre consulta el estado real del pago a
  MercadoPago, y es idempotente (un aviso repetido no descuenta stock dos veces).
- **Nadie se registra como admin:** `/register` siempre crea `CLIENTE`; el primer admin sale del seed.
- **Precios al momento de la compra:** `OrderItem.unitPrice` guarda el precio de ese día; cambiar
  el precio del producto después no altera órdenes viejas.

## Estructura

```
apps/api/        Express + Prisma (src/routes, controllers, services, repositories, docs)
apps/web/        Next.js (src/app, components, lib)
packages/shared/ Schemas Zod usados por la API y la web
ESTUDIO.md       Notas de estudio: arquitectura y el "por qué" de cada fase
SINTAXIS.md      Glosario de sintaxis anclado a código real del proyecto
```
- **El descuento se calcula, no se guarda:** el producto guarda su precio anterior
  (`compareAtPrice`, opcional) y el % OFF sale de compararlo con `price`. Debe ser mayor que el
  precio actual (lo valida el service). Es solo informativo: el checkout cobra `price`.
- **Interfaz siempre clara:** los colores son tokens CSS (`globals.css`); cambiar la identidad es
  editar esos tokens.
