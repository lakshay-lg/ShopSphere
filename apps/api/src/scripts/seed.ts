import { prisma } from "../db.js";

const products = [
  // Audio                                                        // display price (INR)
  { sku: "FLASH-HEADPHONES-001", name: "ShopSphere Sonic Headphones",    priceCents:  499900, stock: 5000  }, // ₹4,999
  { sku: "FLASH-EARBUDS-001",    name: "ProBuds Wireless Earbuds",       priceCents:  249900, stock: 3000  }, // ₹2,499
  { sku: "FLASH-SPEAKER-001",    name: "BoomBox Portable Speaker",       priceCents:  349900, stock: 2000  }, // ₹3,499
  { sku: "FLASH-SOUNDBAR-001",   name: "ClearAudio Soundbar 2.1",        priceCents:  899900, stock: 800   }, // ₹8,999

  // Phones & Tablets
  { sku: "FLASH-PHONE-001",      name: "Nova X15 Smartphone (128 GB)",   priceCents: 3499900, stock: 1200  }, // ₹34,999
  { sku: "FLASH-PHONE-002",      name: "Spark Lite 5G",                  priceCents: 1899900, stock: 2500  }, // ₹18,999
  { sku: "FLASH-TABLET-001",     name: "SlateMax 10\" Tablet",           priceCents: 2499900, stock: 900   }, // ₹24,999
  { sku: "FLASH-TABLET-002",     name: "KidsPad 8\" (64 GB)",            priceCents:  999900, stock: 1500  }, // ₹9,999

  // Laptops & Computers
  { sku: "FLASH-LAPTOP-001",     name: "UltraBook Pro 14\" (16 GB RAM)", priceCents: 7499900, stock: 500   }, // ₹74,999
  { sku: "FLASH-LAPTOP-002",     name: "BudgetBook Air 15\"",            priceCents: 3999900, stock: 800   }, // ₹39,999
  { sku: "FLASH-KEYBOARD-001",   name: "MechType RGB Keyboard",          priceCents:  449900, stock: 4000  }, // ₹4,499
  { sku: "FLASH-MOUSE-001",      name: "SwiftClick Gaming Mouse",        priceCents:  199900, stock: 6000  }, // ₹1,999
  { sku: "FLASH-MONITOR-001",    name: "VividView 27\" 4K Monitor",      priceCents: 2999900, stock: 400   }, // ₹29,999

  // Cameras
  { sku: "FLASH-CAMERA-001",     name: "SnapMaster DSLR Kit",            priceCents: 5999900, stock: 300   }, // ₹59,999
  { sku: "FLASH-WEBCAM-001",     name: "StreamCam 4K USB Webcam",        priceCents:  599900, stock: 3000  }, // ₹5,999

  // Wearables
  { sku: "FLASH-WATCH-001",      name: "PulseTrack Smartwatch Series 3", priceCents: 1299900, stock: 2000  }, // ₹12,999
  { sku: "FLASH-BAND-001",       name: "FitBand Lite Activity Tracker",  priceCents:  299900, stock: 5000  }, // ₹2,999

  // Home Appliances
  { sku: "FLASH-KETTLE-001",     name: "BrewQuick Electric Kettle 1.5L", priceCents:  129900, stock: 8000  }, // ₹1,299
  { sku: "FLASH-TOASTER-001",    name: "CrispPop 4-Slice Toaster",       priceCents:  229900, stock: 4000  }, // ₹2,299
  { sku: "FLASH-FAN-001",        name: "AirCircle Tower Fan",            priceCents:  599900, stock: 2500  }, // ₹5,999
  { sku: "FLASH-VACUUM-001",     name: "DustBuster Robot Vacuum",        priceCents: 1999900, stock: 700   }, // ₹19,999

  // Gaming
  { sku: "FLASH-GAMEPAD-001",    name: "ProPad Wireless Controller",     priceCents:  399900, stock: 4500  }, // ₹3,999
  { sku: "FLASH-HEADSET-001",    name: "GamerVox 7.1 Surround Headset",  priceCents:  649900, stock: 3000  }, // ₹6,499
  { sku: "FLASH-GCARD-001",      name: "TurboGPU RX 7600 8 GB",         priceCents: 4499900, stock: 250   }, // ₹44,999

  // Books & Stationery
  { sku: "FLASH-EREADER-001",    name: "PageTurn E-Ink Reader 6\"",      priceCents:  899900, stock: 1500  }, // ₹8,999
  { sku: "FLASH-NOTEBOOK-001",   name: "SmartNotebook A5 (2-pack)",      priceCents:   49900, stock: 20000 }, // ₹499
];

const main = async (): Promise<void> => {
  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: { name: p.name, priceCents: p.priceCents, stock: p.stock },
      create: { sku: p.sku, name: p.name, priceCents: p.priceCents, stock: p.stock },
    });
    console.log(`Seeded: ${product.sku} — ${product.name} (stock: ${product.stock})`);
  }
  console.log(`\nDone. Upserted ${products.length} products.`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
