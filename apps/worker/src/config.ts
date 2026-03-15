import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  ORDER_LOCK_TTL_MS: z.coerce.number().int().positive().default(5000),
  ORDER_LOCK_RETRY_ATTEMPTS: z.coerce.number().int().positive().default(20),
  ORDER_LOCK_RETRY_DELAY_MS: z.coerce.number().int().positive().default(30),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(64)
});

export const env = envSchema.parse(process.env);
