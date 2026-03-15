# High-Concurrency ShopSphere

Flash-sale ordering engine built with Node.js/TypeScript, BullMQ, Redis distributed locking, and PostgreSQL.

## What is implemented

- Fastify API with product catalog endpoints
- Flash-sale enqueue endpoint that buffers load through BullMQ
- Redis-backed `Idempotency-Key` duplicate request protection
- Worker service that processes orders asynchronously
- Redis lock (`SET NX PX`) + safe Lua unlock to prevent overselling races
- Postgres transaction per job for stock decrement + order write
- React + Vite storefront UI with live polling and order relay tracking
- Docker Compose for local infra (and optional full stack)
- K6 load test script scaffold

## Monorepo layout

```text
apps/
  api/
  web/
  worker/
packages/
  shared/
prisma/
scripts/
```

## Step-by-step run

1. Install dependencies:

```bash
pnpm install
```

2. Copy env:

```bash
cp .env.example .env
```

Optional web env (only if API is not on `http://localhost:3000`):

```bash
cp apps/web/.env.example apps/web/.env
```

3. Start infra only (recommended for local dev):

```bash
pnpm compose:infra
```

If `5432` or `6379` is already in use, run with overrides:

```bash
SHOPSPHERE_POSTGRES_PORT=5433 SHOPSPHERE_REDIS_PORT=6380 docker compose up -d postgres redis
```

4. Generate Prisma client and run migration:

```bash
pnpm prisma:generate
pnpm prisma:migrate --name init
```

5. Seed one flash-sale product:

```bash
pnpm db:seed
```

6. Start API + worker:

```bash
pnpm dev
```

7. Start frontend (new terminal):

```bash
pnpm dev:web
```

Or run all three together:

```bash
pnpm dev:all
```

8. Smoke test:

```bash
curl -X GET http://localhost:3000/health
curl -X GET http://localhost:3000/api/products
```

9. Open storefront:

`http://localhost:5173`

## API quick reference

- `POST /api/products`
- `GET /api/products`
- `PATCH /api/products/:productId/stock`
- `POST /api/flash-sale/order`
- `GET /api/flash-sale/order/:jobId`

### Place order example

```bash
curl -X POST http://localhost:3000/api/flash-sale/order \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: req-12345" \
  -d '{"userId":"u-101","productId":"<PRODUCT_ID>","quantity":1}'
```

If you send the same `Idempotency-Key` for the same user again, the API returns the original `jobId` instead of queuing a duplicate order.

### Track order example

```bash
curl -X GET http://localhost:3000/api/flash-sale/order/<JOB_ID>
```

## Frontend quick reference

- Product cards support search + sorting (name, price, stock)
- Product cards show live stock, urgency signal, and per-card quantity selection
- "Add to Cart" stages multiple products, while "Quick Queue" sends one line instantly
- "Checkout Cart" dispatches multi-item orders sequentially and clears successful lines
- Checkout validates stock before dispatch and surfaces per-line errors
- Order relay polls every 2s and shows queue state + final order result
- Manual job lookup lets you inspect any known queue job id

## Load testing

Export the seeded product ID first, then run k6:

```bash
export PRODUCT_ID=<PRODUCT_ID>
pnpm load:test
```

Or directly:

```bash
k6 run -e PRODUCT_ID=<PRODUCT_ID> scripts/load-test.js
```

## Optional: full stack in Compose

Runs API + worker inside containers too:

```bash
docker compose --profile full up --build
```

## Notes

- This is Phase 1: catalog + flash-sale order pipeline.
- Auth/admin/reporting can be added in Phase 2.
