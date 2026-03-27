import { z } from "zod";

export const FLASH_SALE_QUEUE = "flash-sale-orders";

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(10),
});

export const enqueueOrderSchema = z.object({
  userId: z.string().min(1),
  items: z.array(orderItemSchema).min(1).max(20),
  shippingAddressId: z.string().optional(),
});

export type OrderItemPayload = z.infer<typeof orderItemSchema>;
export type EnqueueOrderPayload = z.infer<typeof enqueueOrderSchema>;

export type FlashSaleOrderJob = EnqueueOrderPayload & {
  requestedAt: string;
};
