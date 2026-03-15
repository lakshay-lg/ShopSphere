import type { FastifyInstance } from "fastify";
import { z } from "zod";

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

    // Log the submission — in production wire to an email service or store in DB
    app.log.info(
      { contact: { name, email, messagePreview: message.slice(0, 100) } },
      "Contact form submission received"
    );

    return reply.status(200).send({
      ok: true,
      message: "Message received. We'll get back to you within 24 hours.",
    });
  });
}
