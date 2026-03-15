import { Queue } from "bullmq";
import { FLASH_SALE_QUEUE, type FlashSaleOrderJob } from "@shopsphere/shared";
import { env } from "./config.js";

const redisUrl = new URL(env.REDIS_URL);

const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || "6379"),
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  db: Number(redisUrl.pathname.replace("/", "") || "0")
};

export const orderQueue = new Queue(FLASH_SALE_QUEUE, {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 150
    },
    removeOnComplete: 1000,
    removeOnFail: 1000
  }
});

export const enqueueFlashSaleOrder = async (payload: FlashSaleOrderJob) => {
  return orderQueue.add("place-order", payload);
};
