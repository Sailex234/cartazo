# Cartazo

Tienda online full-stack (Node.js + TypeScript + Express + Prisma + PostgreSQL en el
backend, Next.js + Tailwind en el frontend). Reemplaza por completo el CRUD original
en PHP plano.

Proyecto en construcción — ver el plan de implementación por fases. Este README se
completará con instrucciones de setup, arquitectura y screenshots en la fase final.

## Desarrollo local

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
npm install
docker compose up -d      # Postgres
npm run dev:api            # http://localhost:4000
npm run dev:web             # http://localhost:3000 (o el siguiente puerto libre)
```
