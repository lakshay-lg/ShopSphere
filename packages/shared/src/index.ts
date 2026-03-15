import { z } from "zod";

export const FLASH_SALE_QUEUE = "flash-sale-orders";

export const enqueueOrderSchema = z.object({
  userId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(10)
});

export type EnqueueOrderPayload = z.infer<typeof enqueueOrderSchema>;

export type FlashSaleOrderJob = EnqueueOrderPayload & {
  requestedAt: string;
};
