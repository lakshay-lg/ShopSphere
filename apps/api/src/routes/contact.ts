import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { env } from "../config.js";

const contactBody = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

export async function contactRoutes(app: FastifyInstance): Promise<void> {
  app.post("/contact", async (request, reply) => {
    const parsed = contactBody.safeParse(request.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return reply
        .status(400)
        .send({ error: firstError?.message ?? "Invalid input" });
    }

    const { name, email, message } = parsed.data;

    const saved = await prisma.contactMessage.create({
      data: { name, email, message },
      select: { id: true, email: true, createdAt: true },
    });

    app.log.info(
      {
        contact: {
          id: saved.id,
          email: saved.email,
          createdAt: saved.createdAt,
          messagePreview: message.slice(0, 100),
        },
      },
      "Contact form submission stored"
    );

    return reply.status(200).send({
      ok: true,
      message: "Message received. We'll get back to you within 24 hours.",
      submissionId: saved.id,
    });
  });

  // GET /api/admin/contact-messages — list all submissions (admin token required)
  app.get("/admin/contact-messages", async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (authHeader !== `Bearer ${env.ADMIN_TOKEN}`) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { messages };
  });
}
