import type { FastifyPluginAsync } from "fastify";
import { enqueueOrderSchema } from "@shopsphere/shared";
import { z } from "zod";
import { prisma } from "../db.js";
import {
  persistIdempotencyJob,
  releaseIdempotencyKey,
  reserveIdempotencyKey
} from "../idempotency.js";
import { enqueueFlashSaleOrder, orderQueue } from "../queue.js";

const jobParamsSchema = z.object({
  jobId: z.string().min(1)
});

export const orderRoutes: FastifyPluginAsync = async (app) => {
  app.post("/flash-sale/order", async (req, reply) => {
    const rawIdempotencyKey = req.headers["idempotency-key"];
    const idempotencyKey = (Array.isArray(rawIdempotencyKey) ? rawIdempotencyKey[0] : rawIdempotencyKey)?.trim();

    if (!idempotencyKey) {
      return reply.code(400).send({
        message: "Missing required Idempotency-Key header"
      });
    }

    const parsed = enqueueOrderSchema.safeParse(req.body);

    if (!parsed.success) {
      return reply.code(400).send({
        message: "Invalid request body",
        issues: parsed.error.flatten()
      });
    }

    const product = await prisma.product.findUnique({
      where: {
        id: parsed.data.productId
      },
      select: {
        id: true
      }
    });

    if (!product) {
      return reply.code(404).send({
        message: "Product not found"
      });
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

        return reply.code(500).send({
          message: "Queue did not return a job id"
        });
      }

      const jobId = String(job.id);
      await persistIdempotencyJob(reservation.redisKey, jobId);

      return reply.code(202).send({
        status: "QUEUED",
        jobId,
        idempotencyKey
      });
    } catch (error) {
      await releaseIdempotencyKey(reservation.redisKey);
      throw error;
    }
  });

  app.get("/flash-sale/order/:jobId", async (req, reply) => {
    const parsed = jobParamsSchema.safeParse(req.params);

    if (!parsed.success) {
      return reply.code(400).send({
        message: "Invalid params",
        issues: parsed.error.flatten()
      });
    }

    const job = await orderQueue.getJob(parsed.data.jobId);
    const queueState = job ? await job.getState() : "NOT_FOUND";

    const order = await prisma.order.findUnique({
      where: {
        queueJobId: parsed.data.jobId
      }
    });

    if (!job && !order) {
      return reply.code(404).send({
        message: "Job and order not found"
      });
    }

    return {
      jobId: parsed.data.jobId,
      queueState,
      order
    };
  });
};
