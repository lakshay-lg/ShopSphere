import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { env } from "../config.js";

function requireAdmin(authHeader: string | undefined, reply: FastifyReply): boolean {
  if (authHeader !== `Bearer ${env.ADMIN_TOKEN}`) {
    void reply.status(401).send({ error: "Unauthorized" });
    return false;
  }
  return true;
}

const createProductBody = z.object({
  sku: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  priceCents: z.number().int().positive(),
  stock: z.number().int().min(0),
});

const updateProductBody = z.object({
  sku: z.string().min(1).max(64).optional(),
  name: z.string().min(1).max(255).optional(),
  priceCents: z.number().int().positive().optional(),
  stock: z.number().int().min(0).optional(),
});

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  // ── Products ──────────────────────────────────────────────────────────────

  app.get("/admin/products", async (request, reply) => {
    if (!requireAdmin(request.headers.authorization, reply)) return;
    const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
    return { products };
  });

  app.post("/admin/products", async (request, reply) => {
    if (!requireAdmin(request.headers.authorization, reply)) return;
    const parsed = createProductBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.errors[0]?.message ?? "Invalid input" });
    }
    const { sku, name, priceCents, stock } = parsed.data;
    try {
      const product = await prisma.product.create({ data: { sku, name, priceCents, stock } });
      return reply.status(201).send({ product });
    } catch {
      return reply.status(409).send({ error: "SKU already exists" });
    }
  });

  app.patch("/admin/products/:id", async (request, reply) => {
    if (!requireAdmin(request.headers.authorization, reply)) return;
    const { id } = request.params as { id: string };
    const parsed = updateProductBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.errors[0]?.message ?? "Invalid input" });
    }
    try {
      const product = await prisma.product.update({ where: { id }, data: parsed.data });
      return { product };
    } catch {
      return reply.status(404).send({ error: "Product not found" });
    }
  });

  app.delete("/admin/products/:id", async (request, reply) => {
    if (!requireAdmin(request.headers.authorization, reply)) return;
    const { id } = request.params as { id: string };
    try {
      await prisma.product.delete({ where: { id } });
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ error: "Product not found" });
    }
  });

  // ── Stats ─────────────────────────────────────────────────────────────────

  app.get("/admin/stats", async (request, reply) => {
    if (!requireAdmin(request.headers.authorization, reply)) return;
    const [userCount, totalOrders, confirmedOrders, products] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.findMany({
        where: { status: "CONFIRMED" },
        select: { items: { select: { priceCents: true, quantity: true } } },
      }),
      prisma.product.findMany({ select: { stock: true } }),
    ]);
    const confirmedCount = confirmedOrders.length;
    const revenue = confirmedOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.priceCents * i.quantity, 0),
      0
    );
    const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
    const outOfStockCount = products.filter((p) => p.stock <= 0).length;
    return { userCount, totalOrders, confirmedCount, revenue, lowStockCount, outOfStockCount };
  });

  // ── Orders ────────────────────────────────────────────────────────────────

  app.get("/admin/orders", async (request, reply) => {
    if (!requireAdmin(request.headers.authorization, reply)) return;
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        userId: true,
        status: true,
        failureReason: true,
        createdAt: true,
        items: { select: { priceCents: true, quantity: true, product: { select: { name: true, sku: true } } } },
      },
    });
    const userIds = [...new Set(orders.map((o) => o.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.email]));
    return {
      orders: orders.map((o) => ({
        ...o,
        userEmail: userMap.get(o.userId) ?? "unknown",
        total: o.items.reduce((s, i) => s + i.priceCents * i.quantity, 0),
      })),
    };
  });

  // ── Users ─────────────────────────────────────────────────────────────────

  app.get("/admin/users", async (request, reply) => {
    if (!requireAdmin(request.headers.authorization, reply)) return;
    const [users, orderCounts] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, email: true, createdAt: true },
      }),
      prisma.order.groupBy({ by: ["userId"], _count: { id: true } }),
    ]);
    const countMap = new Map(orderCounts.map((oc) => [oc.userId, oc._count.id]));
    return {
      users: users.map((u) => ({ ...u, _count: { orders: countMap.get(u.id) ?? 0 } })),
    };
  });

  app.delete("/admin/users/:id", async (request, reply) => {
    if (!requireAdmin(request.headers.authorization, reply)) return;
    const { id } = request.params as { id: string };
    try {
      await prisma.user.delete({ where: { id } });
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ error: "User not found" });
    }
  });
}
