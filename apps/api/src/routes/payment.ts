import type { FastifyPluginAsync } from "fastify";
import Razorpay from "razorpay";
import { z } from "zod";
import { env } from "../config.js";

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

const createOrderSchema = z.object({
  amountCents: z.number().int().positive(),
  currency: z.string().default("INR"),
  receipt: z.string().min(1).max(40),
});

export const paymentRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/payments/create-order
  // Creates a Razorpay order that the frontend uses to open the checkout modal.
  // Amount is in paise (1 INR = 100 paise), same as our priceCents unit.
  app.post("/payments/create-order", async (req, reply) => {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid request body", issues: parsed.error.flatten() });
    }

    const { amountCents, currency, receipt } = parsed.data;

    const order = await razorpay.orders.create({
      amount: amountCents,
      currency,
      receipt,
    });

    return reply.code(201).send({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.RAZORPAY_KEY_ID,
    });
  });
};
