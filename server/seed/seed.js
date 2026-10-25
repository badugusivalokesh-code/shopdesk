import dotenv from "dotenv";
import mongoose from "mongoose";

import dns from "node:dns";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectDB } from "../config/db.js";
import { validateEnv } from "../config/env.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { hashPassword } from "../utils/password.js";

dotenv.config();

const DEMO_USER = Object.freeze({
  email: "admin@shopdesk.dev",
  name: "ShopDesk Admin",
});
const DEMO_PASSWORD = "Admin@123";

const DEMO_PRODUCTS = Object.freeze([
  {
    name: "ShopDesk Demo Wireless Keyboard",
    category: "Electronics",
    price: 49.99,
    stock: 12,
  },
  {
    name: "ShopDesk Demo USB-C Hub",
    category: "Electronics",
    price: 34.5,
    stock: 4,
  },
  {
    name: "ShopDesk Demo Noise-Canceling Headphones",
    category: "Electronics",
    price: 89.99,
    stock: 8,
  },
  {
    name: "ShopDesk Demo Portable SSD",
    category: "Electronics",
    price: 119,
    stock: 3,
  },
  {
    name: "ShopDesk Demo Smart Desk Lamp",
    category: "Electronics",
    price: 39.95,
    stock: 15,
  },
  {
    name: "ShopDesk Demo Webcam",
    category: "Electronics",
    price: 59,
    stock: 5,
  },
  {
    name: "ShopDesk Demo Bluetooth Speaker",
    category: "Electronics",
    price: 45.75,
    stock: 10,
  },
  {
    name: "ShopDesk Demo Power Bank",
    category: "Electronics",
    price: 29.99,
    stock: 0,
  },
  {
    name: "ShopDesk Demo Cotton T-Shirt",
    category: "Clothing",
    price: 19.99,
    stock: 24,
  },
  {
    name: "ShopDesk Demo Zip Hoodie",
    category: "Clothing",
    price: 54.99,
    stock: 6,
  },
  {
    name: "ShopDesk Demo Running Socks",
    category: "Clothing",
    price: 12.5,
    stock: 30,
  },
  {
    name: "ShopDesk Demo Canvas Cap",
    category: "Clothing",
    price: 18,
    stock: 2,
  },
  {
    name: "ShopDesk Demo Denim Jacket",
    category: "Clothing",
    price: 79.95,
    stock: 4,
  },
  {
    name: "ShopDesk Demo Lounge Pants",
    category: "Clothing",
    price: 39.99,
    stock: 9,
  },
  {
    name: "ShopDesk Demo Rain Shell",
    category: "Clothing",
    price: 64,
    stock: 7,
  },
  {
    name: "ShopDesk Demo Wool Beanie",
    category: "Clothing",
    price: 16.75,
    stock: 1,
  },
  {
    name: "ShopDesk Demo Pour-Over Kettle",
    category: "Home & Kitchen",
    price: 44.99,
    stock: 11,
  },
  {
    name: "ShopDesk Demo Ceramic Mug Set",
    category: "Home & Kitchen",
    price: 24.5,
    stock: 18,
  },
  {
    name: "ShopDesk Demo Bamboo Cutting Board",
    category: "Home & Kitchen",
    price: 27.95,
    stock: 5,
  },
  {
    name: "ShopDesk Demo Electric Blender",
    category: "Home & Kitchen",
    price: 69.99,
    stock: 3,
  },
  {
    name: "ShopDesk Demo Linen Apron",
    category: "Home & Kitchen",
    price: 22,
    stock: 13,
  },
  {
    name: "ShopDesk Demo Storage Basket",
    category: "Home & Kitchen",
    price: 31.25,
    stock: 0,
  },
  {
    name: "ShopDesk Demo Cast Iron Pan",
    category: "Home & Kitchen",
    price: 49.5,
    stock: 8,
  },
  {
    name: "ShopDesk Demo Leather Wallet",
    category: "Accessories",
    price: 35,
    stock: 14,
  },
  {
    name: "ShopDesk Demo Travel Organizer",
    category: "Accessories",
    price: 28.99,
    stock: 4,
  },
  {
    name: "ShopDesk Demo Stainless Bottle",
    category: "Accessories",
    price: 26.95,
    stock: 20,
  },
  {
    name: "ShopDesk Demo Key Finder Tag",
    category: "Accessories",
    price: 21.49,
    stock: 5,
  },
  {
    name: "ShopDesk Demo Sunglasses Case",
    category: "Accessories",
    price: 14.75,
    stock: 10,
  },
  {
    name: "ShopDesk Demo Desk Mat",
    category: "Accessories",
    price: 32,
    stock: 7,
  },
  {
    name: "ShopDesk Demo Cable Organizer",
    category: "Accessories",
    price: 11.99,
    stock: 2,
  },
]);

const ORDER_STATUSES = Object.freeze([
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
]);
const ORDER_COUNT = 50;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function configureDns(servers) {
  if (servers?.length) {
    dns.setServers(servers);
  }
}

function sanitizeErrorOutput(value) {
  let output = String(value);
  const sensitiveValues = [
    process.env.MONGODB_URI,
    process.env.JWT_SECRET,
    DEMO_PASSWORD,
  ];

  for (const sensitiveValue of sensitiveValues) {
    if (typeof sensitiveValue === "string" && sensitiveValue.length > 0) {
      output = output.replaceAll(sensitiveValue, "[REDACTED]");
    }
  }

  output = output.replace(
    /mongodb(?:\+srv)?:\/\/[^\s"'`]+/gi,
    "[REDACTED_MONGODB_URI]",
  );

  return output
    .replace(
      /((?:password|passwd|pwd|jwt[_-]?secret|secret|token)\s*(?:=|:)\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
      "$1[REDACTED]",
    )
    .replace(/(authorization\s*:\s*bearer\s+)[^\s,;]+/gi, "$1[REDACTED]");
}

function reportSeedError(error) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error(`[ShopDesk] Seed failed: ${sanitizeErrorOutput(message)}`);

  if (stack) {
    console.error(sanitizeErrorOutput(stack));
  }
}

function roundToCents(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getUtcDateForOrder(index, now = new Date()) {
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    12,
    0,
    0,
    0,
  );

  return new Date(
    todayUtc - (index % 14) * MILLISECONDS_PER_DAY + (index % 60) * 60 * 1000,
  );
}

function buildDemoOrders(now = new Date()) {
  return Array.from({ length: ORDER_COUNT }, (_, index) => {
    const primaryProduct = DEMO_PRODUCTS[(index * 7) % DEMO_PRODUCTS.length];
    const secondaryProduct =
      DEMO_PRODUCTS[(index * 7 + 11) % DEMO_PRODUCTS.length];
    const items = [
      {
        productName: primaryProduct.name,
        quantity: (index % 3) + 1,
        unitPrice: primaryProduct.price,
      },
    ];

    if (index % 3 === 2) {
      items.push({
        productName: secondaryProduct.name,
        quantity: ((index + 1) % 2) + 1,
        unitPrice: secondaryProduct.price,
      });
    }

    const total = roundToCents(
      items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      ),
    );
    const orderDate = getUtcDateForOrder(index, now);

    return {
      orderNo: `SHOPDESK-DEMO-ORDER-${String(index + 1).padStart(3, "0")}`,
      customerName: `ShopDesk Demo Customer ${String(index + 1).padStart(3, "0")}`,
      items,
      total,
      status: ORDER_STATUSES[index % ORDER_STATUSES.length],
      createdAt: orderDate,
      updatedAt: orderDate,
    };
  });
}

async function seedDatabase() {
  let succeeded = false;

  try {
    const config = validateEnv();
    configureDns(config.dnsServers);
    await connectDB(config);

    const passwordHash = await hashPassword(DEMO_PASSWORD);
    await User.updateOne(
      { email: DEMO_USER.email },
      {
        $set: {
          email: DEMO_USER.email,
          name: DEMO_USER.name,
          passwordHash,
        },
      },
      {
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    for (const product of DEMO_PRODUCTS) {
      await Product.updateOne(
        { name: product.name, category: product.category },
        { $set: { ...product } },
        {
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );
    }

    for (const order of buildDemoOrders()) {
      await Order.replaceOne(
        { orderNo: order.orderNo },
        order,
        {
          upsert: true,
          runValidators: true,
          timestamps: false,
        },
      );
    }

    succeeded = true;
  } catch (error) {
    reportSeedError(error);
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
    } catch (error) {
      succeeded = false;
      process.exitCode = 1;
      reportSeedError(error);
    }
  }

  if (succeeded) {
    console.log("[ShopDesk] Seed complete: 1 user, 30 products, 50 orders.");
  } else {
    console.error("[ShopDesk] Seed did not complete.");
  }
}

const isEntryPoint =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isEntryPoint) {
  seedDatabase();
}
