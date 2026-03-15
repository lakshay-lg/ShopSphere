# ShopSphere

High-concurrency flash-commerce platform with a queue-first ordering pipeline, Redis idempotency controls, and a multi-page React storefront.

## Highlights

- Fastify API with catalog, flash-sale ordering, auth, and contact endpoints
- BullMQ queue + worker for asynchronous order processing under burst traffic
- Redis idempotency key reservation to prevent duplicate order enqueueing
- Redis stock lock (`SET NX PX`) with safe release to reduce oversell races
- PostgreSQL + Prisma for persistent products, orders, and users
- React + Vite frontend with route-based site shell and marketplace UX
- Login/register flow with JWT-based session handling in browser
- Contact form submission endpoint with validation and API feedback
- Long-form blog system with dedicated article routes
- Custom randomized 404 page with easter-egg gags
- Docker Compose profiles for infra-only and full local stack

## Current Site Routes

- `/` Home
- `/marketplace` Product + cart + order relay view
- `/blog` Blog listing page
- `/blog/:slug` Individual blog post page
- `/contact` Contact form page
- `/login` Login/Register page
- `*` Custom 404 page

## Monorepo Layout

```text
apps/
  api/      Fastify API
  web/      React + Vite frontend
  worker/   BullMQ order worker
packages/
  shared/   Shared schemas/types
prisma/     Prisma schema + migrations
scripts/    Load test script
```

## Tech Stack

- Node.js 20+
- TypeScript
- Fastify
- Prisma
- PostgreSQL
- Redis
- BullMQ
- React 18
- Vite
- pnpm workspaces
- Docker Compose

## Local Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Optional web env copy if frontend should call a non-default API URL:

```bash
cp apps/web/.env.example apps/web/.env
```

### 3. Start infra (Postgres + Redis)

```bash
pnpm compose:infra
```

If ports are occupied locally:

```bash
SHOPSPHERE_POSTGRES_PORT=5433 SHOPSPHERE_REDIS_PORT=6380 docker compose up -d postgres redis
```

### 4. Run Prisma

Generate Prisma client:

```bash
pnpm prisma:generate
```

Apply committed migrations:

```bash
pnpm prisma:deploy
```

If you are creating new migrations during development:

```bash
pnpm prisma:migrate --name <migration_name>
```

### 5. Seed product data

```bash
pnpm db:seed
```

### 6. Run services

Run API + worker:

```bash
pnpm dev
```

Run frontend in another terminal:

```bash
pnpm dev:web
```

Or run all three together:

```bash
pnpm dev:all
```

## Local URLs

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000`
- Health check: `http://localhost:3000/health`

## API Reference

### Health

- `GET /health`

### Products

- `POST /api/products`
- `GET /api/products`
- `PATCH /api/products/:productId/stock`

### Flash-Sale Orders

- `POST /api/flash-sale/order`
- `GET /api/flash-sale/order/:jobId`

`POST /api/flash-sale/order` requires header:

- `Idempotency-Key: <unique-value-per-attempt>`

Example:

```bash
curl -X POST http://localhost:3000/api/flash-sale/order \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: req-12345" \
  -d '{"userId":"u-101","productId":"<PRODUCT_ID>","quantity":1}'
```

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Register example:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"passw0rd123"}'
```

Login example:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"passw0rd123"}'
```

### Contact

- `POST /api/contact`

Example:

```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Lakshay","email":"lakshay@example.com","message":"Loved the architecture breakdown."}'
```

Note: contact submissions are validated and stored in PostgreSQL via the `ContactMessage` model.

## Frontend Behavior

- Marketplace supports search + sorting (name/price/stock)
- Cart supports add/update/remove/clear and multi-line sequential checkout
- Quick Queue allows one-click single-line dispatch
- Order relay tracks queue status and final order result with polling
- Login page supports register/login/logout via API
- Auth token is stored in browser `localStorage` as `ss_token`
- Blog has listing + full article routes
- Unknown routes show custom randomized 404 gags

## Load Testing

Export a valid product ID first:

```bash
export PRODUCT_ID=<PRODUCT_ID>
pnpm load:test
```

Or run k6 directly:

```bash
k6 run -e PRODUCT_ID=<PRODUCT_ID> scripts/load-test.js
```

## Docker Compose Modes

Infra only:

```bash
pnpm compose:infra
```

Full stack (API + worker in containers too):

```bash
pnpm compose:full
```

Shutdown and remove volumes:

```bash
pnpm compose:down
```

## Troubleshooting

- `P1001: Can't reach database server`
  - Verify Postgres is running and your `DATABASE_URL` port matches Compose mapping.
- `bind: address already in use` for `5432` or `6379`
  - Start with `SHOPSPHERE_POSTGRES_PORT` / `SHOPSPHERE_REDIS_PORT` overrides.
- API returns DB errors while Postgres is healthy
  - Confirm the running API process uses the same DB port as current Compose mapping.

## Security Notes

- Passwords are stored as bcrypt hashes (`User.passwordHash`), not plaintext
- JWT signing uses `JWT_SECRET` from environment
- Do not commit real `.env` values; only `.env.example` should be tracked
