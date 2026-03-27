import crypto from "node:crypto";
import { Worker, type Job } from "bullmq";
import { type Prisma } from "@prisma/client";
import { FLASH_SALE_QUEUE, type FlashSaleOrderJob } from "@shopsphere/shared";
import { prisma } from "./db.js";
import { env } from "./config.js";
import { acquireLockWithRetry, createRedisConnection, releaseLockSafely } from "./redis.js";

const workerConnection = createRedisConnection();

const redisUrl = new URL(env.REDIS_URL);
const workerQueueConnection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || "6379"),
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  db: Number(redisUrl.pathname.replace("/", "") || "0")
};

const processOrder = async (job: Job<FlashSaleOrderJob>): Promise<void> => {
  if (job.id == null) {
    throw new Error("Queue job has no id");
  }

  const queueJobId = String(job.id);
  const { userId, items, shippingAddressId } = job.data;

  // Sort by productId for consistent lock acquisition order (deadlock prevention)
  const sortedItems = [...items].sort((a, b) => a.productId.localeCompare(b.productId));

  // Acquire a lock per unique product
  const lockTokens = new Map<string, string>();

  for (const { productId } of sortedItems) {
    if (lockTokens.has(productId)) continue;

    const lockKey = `lock:product:${productId}`;
    const lockToken = crypto.randomUUID();
    const acquired = await acquireLockWithRetry(workerConnection, lockKey, lockToken);

    if (!acquired) {
      // Release any locks already held before throwing
      for (const [pid, token] of lockTokens) {
        await releaseLockSafely(workerConnection, `lock:product:${pid}`, token);
      }
      throw new Error(`Could not acquire lock for product ${productId}`);
    }

    lockTokens.set(productId, lockToken);
  }

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Idempotency: if this job was already processed, skip
      const existing = await tx.order.findUnique({ where: { queueJobId } });
      if (existing) return;

      // Fetch current stock + price snapshot for all products in one pass
      const productRows = await Promise.all(
        sortedItems.map(({ productId }) =>
          tx.product.findUnique({
            where: { id: productId },
            select: { id: true, stock: true, priceCents: true },
          })
        )
      );

      // Verify all products exist
      for (let i = 0; i < sortedItems.length; i++) {
        if (!productRows[i]) {
          const pid = sortedItems[i]?.productId ?? "unknown";
          throw new Error(`Product ${pid} not found while processing order ${queueJobId}`);
        }
      }

      const productMap = new Map(
        productRows.map((p) => [p!.id, { stock: p!.stock, priceCents: p!.priceCents }])
      );

      // Find first item with insufficient stock
      const insufficientItem = sortedItems.find(({ productId, quantity }) => {
        return (productMap.get(productId)?.stock ?? 0) < quantity;
      });

      if (insufficientItem) {
        await tx.order.create({
          data: {
            queueJobId,
            userId,
            status: "FAILED",
            failureReason: `INSUFFICIENT_STOCK:${insufficientItem.productId}`,
            shippingAddressId: shippingAddressId ?? null,
          },
        });
        return;
      }

      // Decrement stock for all items
      await Promise.all(
        sortedItems.map(({ productId, quantity }) =>
          tx.product.update({
            where: { id: productId },
            data: { stock: { decrement: quantity } },
          })
        )
      );

      // Create confirmed order with all line items (price snapshot included)
      await tx.order.create({
        data: {
          queueJobId,
          userId,
          status: "CONFIRMED",
          shippingAddressId: shippingAddressId ?? null,
          items: {
            create: sortedItems.map(({ productId, quantity }) => ({
              productId,
              quantity,
              priceCents: productMap.get(productId)!.priceCents,
            })),
          },
        },
      });
    });
  } finally {
    for (const [productId, token] of lockTokens) {
      await releaseLockSafely(workerConnection, `lock:product:${productId}`, token);
    }
  }
};

const worker = new Worker<FlashSaleOrderJob>(
  FLASH_SALE_QUEUE,
  async (job) => {
    await processOrder(job);
  },
  {
    connection: workerQueueConnection,
    concurrency: env.WORKER_CONCURRENCY
  }
);

worker.on("ready", () => {
  console.log(`[worker] Ready. queue=${FLASH_SALE_QUEUE} concurrency=${env.WORKER_CONCURRENCY}`);
});

worker.on("completed", (job) => {
  console.log(`[worker] Completed job ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`[worker] Failed job ${job?.id}`, error.message);
});

const shutdown = async (): Promise<void> => {
  await worker.close();
  await workerConnection.quit();
  await prisma.$disconnect();
};

process.on("SIGTERM", () => {
  void shutdown();
});

process.on("SIGINT", () => {
  void shutdown();
});
