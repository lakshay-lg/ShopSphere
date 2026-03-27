import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";

const newsletterBody = z.object({
  email: z.string().email(),
});

export async function newsletterRoutes(app: FastifyInstance): Promise<void> {
  app.post("/newsletter", async (request, reply) => {
    const parsed = newsletterBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "A valid email address is required" });
    }

    const { email } = parsed.data;

    // Upsert — succeed silently if already subscribed
    await prisma.newsletterSubscription.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    return reply.status(200).send({ ok: true, message: "You're subscribed!" });
  });
}
