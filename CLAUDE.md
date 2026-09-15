# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Cartazo** — a full-stack TypeScript e-commerce app (catalog, cart, Stripe checkout, admin
inventory panel). It fully replaces a legacy plain-PHP/PDO/MySQL products CRUD that used to
live in this repo; the old code is gone, this is a from-scratch rewrite, not an incremental
migration. It is a portfolio project — keep solutions solo-project-scale, not
enterprise-scale (no microservices, no k8s).

The project is being built in phases; check recent commits / ask the user for current phase
status before assuming a feature (auth, cart, Stripe, admin panel) already exists.

## Setup

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
npm install
docker compose up -d      # Postgres only, for now
```

Postgres is exposed on host port **5436**, not the default 5432/5433 — several other local
projects on this machine already occupy those ports. It's parametrized via `POSTGRES_PORT` in
`.env`/`docker-compose.yml`, not hardcoded.

## Commands

Run from the repo root (npm workspaces):

```bash
npm run dev:api             # apps/api dev server (tsx watch), http://localhost:4000
npm run dev:web              # apps/web dev server (Next.js), http://localhost:3000 (or next free port)
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

Planned backend layering (routes → controllers → services → repositories):
routes only wire HTTP to a controller; controllers translate req/res to service calls with no
business logic of their own; services hold the business rules and call repositories;
repositories are the only layer that touches Prisma. This is what makes services unit-testable
without a real database — mock the repository, not Prisma.

Errors are meant to flow through custom `AppError` subclasses (`NotFoundError`,
`ValidationError`, etc.) thrown from services/controllers and caught by one centralized Express
error-handling middleware, producing one consistent JSON error shape. This is the direct fix
for the legacy project's worst flaw — every old PHP endpoint had a different, often bare-string
response shape.

Auth (JWT, `admin`/`cliente` roles), Stripe checkout, and the admin panel are not implemented
yet — see the phased roadmap for what's coming and in what order before building ahead of the
current phase.
