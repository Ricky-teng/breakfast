import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedMenu } from "../lib/seed-menu";
import { categories } from "../lib/seed-menu-data";

const connectionString =
  process.env.DATABASE_POSTGRES_URL ?? process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

console.log("清空現有菜單資料…");
seedMenu(prisma)
  .then((itemCount) => {
    console.log(`完成:${categories.length + 1} 個分類、${itemCount} 個品項`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
