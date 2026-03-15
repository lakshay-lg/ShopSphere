import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  IDEMPOTENCY_TTL_SECONDS: z.coerce.number().int().positive().default(7200),
  ORDER_LOCK_TTL_MS: z.coerce.number().int().positive().default(5000),
  ORDER_LOCK_RETRY_ATTEMPTS: z.coerce.number().int().positive().default(20),
  ORDER_LOCK_RETRY_DELAY_MS: z.coerce.number().int().positive().default(30),
  JWT_SECRET: z.string().min(1).default("dev-secret-change-in-production-32chars!")
});

export const env = envSchema.parse(process.env);
