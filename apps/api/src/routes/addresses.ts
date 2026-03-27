import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";
import { env } from "../config.js";

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

const addressBody = z.object({
  fullName:   z.string().min(1).max(100),
  line1:      z.string().min(1).max(200),
  line2:      z.string().max(200).optional(),
  city:       z.string().min(1).max(100),
  state:      z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country:    z.string().length(2).default("IN"),
  isDefault:  z.boolean().optional(),
});

const addressIdParams = z.object({ addressId: z.string().min(1) });

export const addressRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/addresses — list saved addresses for the authenticated user
  app.get("/addresses", async (req, reply) => {
    const userId = extractUserId(req);
    if (!userId) return reply.code(401).send({ message: "Authentication required" });

    const addresses = await prisma.shippingAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return { addresses };
  });

  // POST /api/addresses — create a new address
  app.post("/addresses", async (req, reply) => {
    const userId = extractUserId(req);
    if (!userId) return reply.code(401).send({ message: "Authentication required" });

    const parsed = addressBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid address", issues: parsed.error.flatten() });
    }

    const { isDefault, ...fields } = parsed.data;

    // If this should be the default, unset any existing default first
    if (isDefault) {
      await prisma.shippingAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // First address for this user is always default
    const count = await prisma.shippingAddress.count({ where: { userId } });
    const makeDefault = isDefault ?? count === 0;

    const address = await prisma.shippingAddress.create({
      data: { ...fields, userId, isDefault: makeDefault },
    });

    return reply.code(201).send({ address });
  });

  // PATCH /api/addresses/:addressId/default — set as default
  app.patch("/addresses/:addressId/default", async (req, reply) => {
    const userId = extractUserId(req);
    if (!userId) return reply.code(401).send({ message: "Authentication required" });

    const parsed = addressIdParams.safeParse(req.params);
    if (!parsed.success) return reply.code(400).send({ message: "Invalid params" });

    const address = await prisma.shippingAddress.findUnique({
      where: { id: parsed.data.addressId },
    });
    if (!address) return reply.code(404).send({ message: "Address not found" });
    if (address.userId !== userId) return reply.code(403).send({ message: "Access denied" });

    await prisma.shippingAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
    await prisma.shippingAddress.update({
      where: { id: parsed.data.addressId },
      data: { isDefault: true },
    });

    return { ok: true };
  });

  // DELETE /api/addresses/:addressId — delete an address
  app.delete("/addresses/:addressId", async (req, reply) => {
    const userId = extractUserId(req);
    if (!userId) return reply.code(401).send({ message: "Authentication required" });

    const parsed = addressIdParams.safeParse(req.params);
    if (!parsed.success) return reply.code(400).send({ message: "Invalid params" });

    const address = await prisma.shippingAddress.findUnique({
      where: { id: parsed.data.addressId },
    });
    if (!address) return reply.code(404).send({ message: "Address not found" });
    if (address.userId !== userId) return reply.code(403).send({ message: "Access denied" });

    await prisma.shippingAddress.delete({ where: { id: parsed.data.addressId } });

    return reply.code(204).send();
  });
};
