import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { enqueueOrderSchema } from "@shopsphere/shared";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";
import { env } from "../config.js";
import {
  persistIdempotencyJob,
  releaseIdempotencyKey,
  reserveIdempotencyKey
} from "../idempotency.js";
import { enqueueFlashSaleOrder, orderQueue } from "../queue.js";

const jobParamsSchema = z.object({
  jobId: z.string().min(1)
});

const orderParamsSchema = z.object({
  orderId: z.string().min(1)
});

function extractUserId(req: FastifyRequest): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(auth.slice(7), env.JWT_SECRET) as { userId: string };
    return payload.userId;
  } catch {
    return null;
  }
}

const orderWithItems = {
  id: true,
  queueJobId: true,
  userId: true,
  status: true,
  failureReason: true,
  shippingAddressId: true,
  shippingAddress: {
    select: {
      id: true,
      fullName: true,
      line1: true,
      line2: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
    },
  },
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      productId: true,
      quantity: true,
      priceCents: true,
      product: { select: { id: true, name: true, sku: true } },
    },
  },
} as const;

export const orderRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/flash-sale/order
  app.post("/flash-sale/order", async (req, reply) => {
    const rawIdempotencyKey = req.headers["idempotency-key"];
    const idempotencyKey = (Array.isArray(rawIdempotencyKey) ? rawIdempotencyKey[0] : rawIdempotencyKey)?.trim();

    if (!idempotencyKey) {
      return reply.code(400).send({ message: "Missing required Idempotency-Key header" });
    }

    const parsed = enqueueOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid request body", issues: parsed.error.flatten() });
    }

    // Verify all products exist before queuing
    const productIds = [...new Set(parsed.data.items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true }
    });

    if (products.length !== productIds.length) {
      return reply.code(404).send({ message: "One or more products not found" });
    }

    const reservation = await reserveIdempotencyKey(parsed.data.userId, idempotencyKey);

    if (reservation.type === "replayed") {
      return reply.code(200).send({
        status: "DUPLICATE",
        message: "Returning previously queued request",
        jobId: reservation.jobId,
        idempotencyKey
      });
    }

    if (reservation.type === "in-flight") {
      return reply.code(202).send({
        status: "IN_FLIGHT",
        message: "A request with this idempotency key is still being processed",
        idempotencyKey
      });
    }

    try {
      const job = await enqueueFlashSaleOrder({
        ...parsed.data,
        requestedAt: new Date().toISOString()
      });

      if (job.id == null) {
        await releaseIdempotencyKey(reservation.redisKey);
        return reply.code(500).send({ message: "Queue did not return a job id" });
      }

      const jobId = String(job.id);
      await persistIdempotencyJob(reservation.redisKey, jobId);

      return reply.code(202).send({ status: "QUEUED", jobId, idempotencyKey });
    } catch (error) {
      await releaseIdempotencyKey(reservation.redisKey);
      throw error;
    }
  });

  // GET /api/flash-sale/order/:jobId — poll queue + order status
  app.get("/flash-sale/order/:jobId", async (req, reply) => {
    const parsed = jobParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid params", issues: parsed.error.flatten() });
    }

    const job = await orderQueue.getJob(parsed.data.jobId);
    const queueState = job ? await job.getState() : "NOT_FOUND";

    const order = await prisma.order.findUnique({
      where: { queueJobId: parsed.data.jobId },
      select: orderWithItems,
    });

    if (!job && !order) {
      return reply.code(404).send({ message: "Job and order not found" });
    }

    return { jobId: parsed.data.jobId, queueState, order };
  });

  // GET /api/orders — paginated order history for the authenticated user
  app.get("/orders", async (req, reply) => {
    const userId = extractUserId(req);
    if (!userId) {
      return reply.code(401).send({ message: "Authentication required" });
    }

    const rawCursor = (req.query as Record<string, string>).cursor;
    const rawLimit = (req.query as Record<string, string>).limit;
    const limit = Math.min(Math.max(parseInt(rawLimit ?? "20", 10) || 20, 1), 50);

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(rawCursor ? { cursor: { id: rawCursor }, skip: 1 } : {}),
      select: orderWithItems,
    });

    const hasMore = orders.length > limit;
    const page = hasMore ? orders.slice(0, limit) : orders;
    const nextCursor = hasMore ? page[page.length - 1]?.id : null;

    return { orders: page, nextCursor, hasMore };
  });

  // GET /api/orders/:orderId — single order detail
  app.get("/orders/:orderId", async (req, reply) => {
    const userId = extractUserId(req);
    if (!userId) {
      return reply.code(401).send({ message: "Authentication required" });
    }

    const parsed = orderParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid params" });
    }

    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      select: orderWithItems,
    });

    if (!order) {
      return reply.code(404).send({ message: "Order not found" });
    }

    if (order.userId !== userId) {
      return reply.code(403).send({ message: "Access denied" });
    }

    return { order };
  });
};
