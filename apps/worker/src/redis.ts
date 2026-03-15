import { Redis } from "ioredis";
import { env } from "./config.js";

const releaseLockScript = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0
`;

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

export const createRedisConnection = (): Redis => {
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null
  });
};

export const acquireLockWithRetry = async (
  redis: Redis,
  lockKey: string,
  token: string
): Promise<boolean> => {
  for (let attempt = 0; attempt < env.ORDER_LOCK_RETRY_ATTEMPTS; attempt += 1) {
    const result = await redis.set(lockKey, token, "PX", env.ORDER_LOCK_TTL_MS, "NX");

    if (result === "OK") {
      return true;
    }

    await sleep(env.ORDER_LOCK_RETRY_DELAY_MS);
  }

  return false;
};

export const releaseLockSafely = async (
  redis: Redis,
  lockKey: string,
  token: string
): Promise<void> => {
  await redis.eval(releaseLockScript, 1, lockKey, token);
};
