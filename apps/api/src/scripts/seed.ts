import { prisma } from "../db.js";

const defaultSku = process.env.SEED_SKU ?? "FLASH-HEADPHONES-001";
const defaultName = process.env.SEED_NAME ?? "ShopSphere Sonic Headphones";
const defaultPrice = Number(process.env.SEED_PRICE_CENTS ?? "4999");
const defaultStock = Number(process.env.SEED_STOCK ?? "5000");

const main = async (): Promise<void> => {
  const product = await prisma.product.upsert({
    where: {
      sku: defaultSku
    },
    update: {
      name: defaultName,
      priceCents: defaultPrice,
      stock: defaultStock
    },
    create: {
      sku: defaultSku,
      name: defaultName,
      priceCents: defaultPrice,
      stock: defaultStock
    }
  });

  console.log("Seeded product", {
    id: product.id,
    sku: product.sku,
    stock: product.stock
  });
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
