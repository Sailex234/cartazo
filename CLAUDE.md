# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Cartazo** — a full-stack TypeScript e-commerce app (catalog, cart, MercadoPago checkout, admin
inventory panel). It fully replaces a legacy plain-PHP/PDO/MySQL products CRUD that used to
live in this repo; the old code is gone, this is a from-scratch rewrite, not an incremental
migration. It is a portfolio project — keep solutions solo-project-scale, not
enterprise-scale (no microservices, no k8s).

The project is being built in phases; check recent commits / ask the user for current phase
status before assuming a feature (auth, cart, payments, admin panel) already exists.

**Current phase status** (2026-10-19): Phases 0-4 are done and committed, plus Phase 5 blocks
1-2. Phase 0 (scaffolding), Phase 1 (Prisma schema, Product/Category CRUD by layers, Zod
validation, centralized error handling), Phase 2 (Auth: register/login/logout/me, bcrypt, JWT in
an httpOnly cookie, `requireAuth`/`requireRole('ADMIN')` guarding product/category writes), Phase 3
(Cart, Orders, checkout with **MercadoPago**, not Stripe — Stripe doesn't support Argentina;
webhook + order reconciliation), Phase 4 (Next.js catalog + product detail), Phase 5 block 1
(login/register/session in the web) and block 2 (cart page, add-to-cart, checkout redirect,
`/orders/[id]`), verified end-to-end in the MP sandbox. **Next: the rest of Phase 5 (order history
list) and the admin panel** — check the user for the exact order before building. No public
endpoint creates an ADMIN user (avoids privilege escalation via `/register`, which always
creates `CLIENTE`) — the first admin is bootstrapped via `apps/api/prisma/seed.ts`
(`admin@cartazo.com` / `admin12345`, change in any real environment).

## Setup

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
npm install
docker compose up -d      # Postgres only, for now
```

Postgres is exposed on host port **5437** locally (`POSTGRES_PORT` in `.env`; 5436 collided with
another project), not the default 5432/5433 — several other local projects on this machine
already occupy those ports. It's parametrized via `POSTGRES_PORT` in
`.env`/`docker-compose.yml`, not hardcoded.

Run `docker compose` for this project under the **Docker Desktop** context
(`desktop-linux`), not the native/default engine — check with `docker context show`
(`docker context use desktop-linux` if needed). This machine has both engines with
separate containers; other unrelated local projects run under the native engine, this
one is meant to live under Docker Desktop specifically. A non-default port is still required
either way — the collision is at the host TCP-socket level, not per-engine.

## Commands

Run from the repo root (npm workspaces):

```bash
npm run dev:api             # apps/api dev server (tsx watch), http://localhost:4000
npm run dev:web              # apps/web dev server (Next.js), http://localhost:3001 (pinned; :3000 is taken by another local project)
npm run build                 # build all workspaces
npm run test                   # test all workspaces
npm run lint                    # lint all workspaces
```

Per-package, when you need to target just one (e.g. running a single test file):

```bash
npm run lint --workspace=apps/api
npx tsc -p apps/api/tsconfig.json --noEmit         # typecheck apps/api without emitting
cd apps/api && npx vitest run path/to/file.test.ts  # single test file
```

`apps/web` uses `eslint` directly (from `create-next-app`); `apps/api` uses a flat
`eslint.config.js` with `typescript-eslint`.

## Architecture

npm-workspaces monorepo:

- `apps/api` — Express + TypeScript backend. ESM (`"type": "module"`), `moduleResolution:
  NodeNext`, which means **relative imports between local `.ts` files must use a `.js`
  extension** (e.g. `import { app } from "./app.js"` in `src/index.ts`) — this is a TS/NodeNext
  requirement, not a mistake.
- `apps/web` — Next.js (App Router) + Tailwind frontend, scaffolded via `create-next-app`.
  **Next.js 16 has real breaking changes vs. older training data** — `apps/web/AGENTS.md` (kept
  in sync by `next dev` itself) flags this; check `node_modules/next/dist/docs/` when unsure
  about current App Router APIs before writing frontend code.
- `packages/shared` — Zod schemas / TS types meant to be imported by both `apps/api` and
  `apps/web` as source (no build step: `main`/`types` point straight at `src/index.ts`), so
  request validation and frontend form validation share one definition instead of drifting.

Backend layering (routes → controllers → services → repositories), implemented for
products/categories in Phase 1: routes only wire HTTP to a controller; controllers translate
req/res to service calls with no business logic of their own; services hold the business rules
and call repositories; repositories are the only layer that touches Prisma. This is what makes
services unit-testable without a real database — mock the repository, not Prisma (see
`apps/api/tests/unit/*.service.test.ts` for the pattern to follow in later phases).

**Prisma 7 note**: this project is pinned to Prisma `7.10.0` exact (the `latest` npm dist-tag
was an `8.0.0-rc` release candidate with a broken dependency tree at the time this was set up —
don't blindly `npm install prisma@latest`). Prisma 7 moved the DB connection URL out of
`schema.prisma` into `apps/api/prisma.config.ts`, and `PrismaClient` requires a driver adapter
(`@prisma/adapter-pg` + `pg`) passed to its constructor — see `apps/api/src/lib/prisma.ts`.
Seeding (`apps/api/prisma/seed.ts`) runs via `npx prisma db seed` or automatically after
`npx prisma migrate dev`.

**Auth**: JWT (`{userId, role}`, `apps/api/src/lib/jwt.ts`) stored in an httpOnly cookie
(`apps/api/src/middleware/auth.middleware.ts` exports `requireAuth` and
`requireRole(...roles)`), not localStorage or an `Authorization` header — mitigates XSS token
theft, at the cost of needing CORS `credentials: true` + an explicit `origin` (`WEB_ORIGIN` env
var, no wildcard `*`) for the browser to send/receive the cookie cross-origin between
`apps/web` (`:3001`) and `apps/api` (`:4000`). The frontend must fetch with
`credentials: "include"` for this to work.

Errors are meant to flow through custom `AppError` subclasses (`NotFoundError`,
`ValidationError`, etc.) thrown from services/controllers and caught by one centralized Express
error-handling middleware, producing one consistent JSON error shape. This is the direct fix
for the legacy project's worst flaw — every old PHP endpoint had a different, often bare-string
response shape.

The admin panel and the order history list are not implemented yet — check with the user before building ahead of the current phase.
