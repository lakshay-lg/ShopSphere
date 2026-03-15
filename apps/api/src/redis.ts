import { Redis } from "ioredis";
import { env } from "./config.js";

export const createRedisConnection = (): Redis => {
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null
  });
};
