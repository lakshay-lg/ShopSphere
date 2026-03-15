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
  const { productId, quantity, userId } = job.data;

  const lockKey = `lock:product:${productId}`;
  const lockToken = crypto.randomUUID();

  const lockAcquired = await acquireLockWithRetry(workerConnection, lockKey, lockToken);

  if (!lockAcquired) {
    throw new Error(`Could not acquire lock for product ${productId}`);
  }

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.order.findUnique({
        where: {
          queueJobId
        }
      });

      if (existing) {
        return;
      }

      const product = await tx.product.findUnique({
        where: {
          id: productId
        },
        select: {
          id: true,
          stock: true
        }
      });

      if (!product) {
        throw new Error(`Product ${productId} not found while processing order ${queueJobId}`);
      }

      if (product.stock < quantity) {
        await tx.order.create({
          data: {
            queueJobId,
            userId,
            productId,
            quantity,
            status: "FAILED",
            failureReason: "INSUFFICIENT_STOCK"
          }
        });

        return;
      }

      await tx.product.update({
        where: {
          id: productId
        },
        data: {
          stock: {
            decrement: quantity
          }
        }
      });

      await tx.order.create({
        data: {
          queueJobId,
          userId,
          productId,
          quantity,
          status: "CONFIRMED"
        }
      });
    });
  } finally {
    await releaseLockSafely(workerConnection, lockKey, lockToken);
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
