# ShopSphere

High-concurrency flash-commerce platform with a queue-first ordering pipeline, Redis idempotency controls, and a multi-page React storefront.

## Highlights

- Fastify API with catalog, flash-sale ordering, auth, addresses, newsletter, contact, and admin endpoints
- BullMQ queue + worker for asynchronous order processing under burst traffic
- Redis idempotency key reservation to prevent duplicate order enqueueing
- Redis stock lock (`SET NX PX`) with safe release to reduce oversell races
- PostgreSQL + Prisma for persistent products, orders, users, shipping addresses, contact messages, and newsletter subscriptions
- React + Vite frontend with full route-based site shell and marketplace UX
- JWT-based auth with bcrypt password hashing and per-route rate limiting
- User profile with password change and shipping address management
- Persistent cart and order relay via `localStorage`
- Cursor-based paginated order history with per-order detail view
- Admin dashboard for contact message review, gated by `ADMIN_TOKEN`
- Newsletter subscription capture with idempotent upsert
- Long-form blog system with dedicated article routes
- Privacy Policy and Terms of Service static pages
- Custom randomized 404 page with easter-egg gags
- Docker Compose profiles for infra-only and full local stack

## Current Site Routes

| Route | Page |
|---|---|
| `/` | Home |
| `/marketplace` | Product catalog, cart, flash-sale checkout, order relay |
| `/products/:productId` | Product detail page |
| `/orders` | Paginated order history (auth required) |
| `/orders/:orderId` | Order detail with items and shipping address (auth required) |
| `/profile` | Account info, password change, shipping addresses (auth required) |
| `/blog` | Blog listing |
| `/blog/:slug` | Individual blog post |
| `/contact` | Contact / support form |
| `/admin` | Admin dashboard — contact message viewer (token gated) |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |
| `/login` | Login / Register |
| `*` | Custom 404 |

## Monorepo Layout

```text
apps/
  api/      Fastify API
  web/      React + Vite frontend
  worker/   BullMQ order worker
packages/
  shared/   Shared schemas/types (Zod)
prisma/     Prisma schema + migrations
scripts/    Load test script
```

## Tech Stack

- Node.js 20+
- TypeScript
- Fastify + `@fastify/rate-limit` + `@fastify/cors`
- Prisma
- PostgreSQL
- Redis
- BullMQ
- React 18
- React Router v6
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
- Admin dashboard: `http://localhost:5173/admin`

## API Reference

### Health

- `GET /health`

### Products

- `GET /api/products`
- `GET /api/products/:productId`
- `POST /api/products`
- `PATCH /api/products/:productId/stock`

### Flash-Sale Orders

- `POST /api/flash-sale/order` — requires `Idempotency-Key` header and Bearer token
- `GET /api/flash-sale/order/:jobId` — poll job + order status

Example:

```bash
curl -X POST http://localhost:3000/api/flash-sale/order \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: req-12345" \
  -H "Authorization: Bearer <token>" \
  -d '{"userId":"<userId>","items":[{"productId":"<id>","quantity":1,"priceCents":4999}]}'
```

### Orders

- `GET /api/orders` — paginated order history for authenticated user (cursor-based)
- `GET /api/orders/:orderId` — single order with items and shipping address

### Auth

Rate-limited: register 5/min per IP, login 10/min per IP.

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/auth/me` — change password (requires `currentPassword` + `newPassword`)

Register example:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"passw0rd123"}'
```

### Shipping Addresses

All routes require Bearer token.

- `GET /api/addresses`
- `POST /api/addresses`
- `PATCH /api/addresses/:addressId/default`
- `DELETE /api/addresses/:addressId`

### Newsletter

- `POST /api/newsletter` — subscribe (idempotent; re-subscribing is a no-op)

### Contact

- `POST /api/contact`

```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Lakshay","email":"lakshay@example.com","message":"Loved the architecture breakdown."}'
```

### Admin

- `GET /api/admin/contact-messages` — requires `Authorization: Bearer <ADMIN_TOKEN>`

```bash
curl http://localhost:3000/api/admin/contact-messages \
  -H "Authorization: Bearer dev-admin-token-change-in-production"
```

## Frontend Behavior

- Marketplace supports search + sorting (name/price/stock)
- Cart supports add/update/remove/clear and multi-line sequential checkout; persisted to `localStorage`
- Quick Queue allows one-click single-line dispatch
- Order relay tracks queue status and final order result with polling; persisted to `localStorage`
- Product names link to individual detail pages at `/products/:productId`
- Order history is cursor-paginated; each order links to a detail page showing items, totals, and shipping address
- Profile page allows password change and full shipping address CRUD
- Shipping address pre-selected at checkout from saved addresses (default address auto-selected)
- Admin page at `/admin` prompts for `ADMIN_TOKEN` and renders contact submissions as collapsible cards with reply links
- Login page supports register/login via API; auth token stored as `ss_token` in `localStorage`
- Blog has listing + full article routes; newsletter form persists subscriptions to DB
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
- Order relay shows "completed" with no items after DB row deletion
  - BullMQ job records live in Redis independently of Postgres. Clear via `localStorage.removeItem("ss_order_relay"); location.reload()` or delete the Redis keys directly.

## Security Notes

- Passwords are stored as bcrypt hashes (`User.passwordHash`, cost factor 12), not plaintext
- Login uses constant-time comparison even for unknown emails to prevent user enumeration
- JWT signing uses `JWT_SECRET` from environment; tokens expire after 7 days
- Register is rate-limited to 5 attempts/min per IP; login to 10 attempts/min
- Admin contact endpoint is protected by a separate `ADMIN_TOKEN` env var
- Do not commit real `.env` values; only `.env.example` should be tracked
