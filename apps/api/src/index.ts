import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config.js";
import { prisma } from "./db.js";
import { closeIdempotencyClient } from "./idempotency.js";
import { orderQueue } from "./queue.js";
import { productRoutes } from "./routes/products.js";
import { orderRoutes } from "./routes/orders.js";
import { authRoutes } from "./routes/auth.js";
import { contactRoutes } from "./routes/contact.js";
import { newsletterRoutes } from "./routes/newsletter.js";
import { addressRoutes } from "./routes/addresses.js";

const app = Fastify({
  logger: true
});

const start = async (): Promise<void> => {
  await app.register(cors, { origin: true });
  await app.register(rateLimit, {
    global: false, // opt-in per route; auth routes set their own config below
  });

  await app.register(productRoutes, { prefix: "/api" });
  await app.register(orderRoutes, { prefix: "/api" });
  await app.register(authRoutes, { prefix: "/api" });
  await app.register(contactRoutes, { prefix: "/api" });
  await app.register(newsletterRoutes, { prefix: "/api" });
  await app.register(addressRoutes, { prefix: "/api" });

  app.get("/health", async () => {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: "ok"
    };
  });

  try {
    await app.listen({
      host: "0.0.0.0",
      port: env.PORT
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

const shutdown = async (): Promise<void> => {
  await closeIdempotencyClient();
  await orderQueue.close();
  await prisma.$disconnect();
  await app.close();
};

process.on("SIGTERM", () => {
  void shutdown();
});

process.on("SIGINT", () => {
  void shutdown();
});

void start();
