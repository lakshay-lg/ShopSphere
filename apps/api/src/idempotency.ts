import { env } from "./config.js";
import { createRedisConnection } from "./redis.js";

const IDEMPOTENCY_PENDING = "__PENDING__";
const idempotencyRedis = createRedisConnection();

const buildKey = (userId: string, idempotencyKey: string): string => {
  return `idem:flash-sale:${userId}:${idempotencyKey}`;
};

type IdempotencyReservationResult =
  | { type: "reserved"; redisKey: string }
  | { type: "replayed"; jobId: string }
  | { type: "in-flight" };

export const reserveIdempotencyKey = async (
  userId: string,
  idempotencyKey: string
): Promise<IdempotencyReservationResult> => {
  const redisKey = buildKey(userId, idempotencyKey);

  const reserved = await idempotencyRedis.set(
    redisKey,
    IDEMPOTENCY_PENDING,
    "EX",
    env.IDEMPOTENCY_TTL_SECONDS,
    "NX"
  );

  if (reserved === "OK") {
    return {
      type: "reserved",
      redisKey
    };
  }

  const existing = await idempotencyRedis.get(redisKey);

  if (!existing || existing === IDEMPOTENCY_PENDING) {
    return {
      type: "in-flight"
    };
  }

  return {
    type: "replayed",
    jobId: existing
  };
};

export const persistIdempotencyJob = async (
  redisKey: string,
  jobId: string
): Promise<void> => {
  await idempotencyRedis.set(redisKey, jobId, "EX", env.IDEMPOTENCY_TTL_SECONDS, "XX");
};

export const releaseIdempotencyKey = async (redisKey: string): Promise<void> => {
  await idempotencyRedis.del(redisKey);
};

export const closeIdempotencyClient = async (): Promise<void> => {
  await idempotencyRedis.quit();
};
