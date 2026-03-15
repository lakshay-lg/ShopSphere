import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";

const createProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  priceCents: z.number().int().positive(),
  stock: z.number().int().nonnegative()
});

const updateStockSchema = z.object({
  stock: z.number().int().nonnegative()
});

const productParamsSchema = z.object({
  productId: z.string().min(1)
});

export const productRoutes: FastifyPluginAsync = async (app) => {
  app.get("/products", async () => {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    return { products };
  });

  app.post("/products", async (req, reply) => {
    const parsed = createProductSchema.safeParse(req.body);

    if (!parsed.success) {
      return reply.code(400).send({
        message: "Invalid request body",
        issues: parsed.error.flatten()
      });
    }

    const created = await prisma.product.create({
      data: parsed.data
    });

    return reply.code(201).send({ product: created });
  });

  app.patch("/products/:productId/stock", async (req, reply) => {
    const paramsParsed = productParamsSchema.safeParse(req.params);
    const bodyParsed = updateStockSchema.safeParse(req.body);

    if (!paramsParsed.success || !bodyParsed.success) {
      return reply.code(400).send({
        message: "Invalid params/body",
        paramIssues: paramsParsed.success ? null : paramsParsed.error.flatten(),
        bodyIssues: bodyParsed.success ? null : bodyParsed.error.flatten()
      });
    }

    const updated = await prisma.product.update({
      where: { id: paramsParsed.data.productId },
      data: { stock: bodyParsed.data.stock }
    });

    return { product: updated };
  });
};
