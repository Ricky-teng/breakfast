import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DATABASE_POSTGRES_URL ?? process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// 標了 ⚠️ 的品名代表原始菜單照片看不清楚,價格是抓相近品項湊出來的估計值,
// 之後要在 /admin/menu 對照實際菜單修正。
type SeedItem = { name: string; price: number };
type SeedCategory = { name: string; items: SeedItem[] };

const categories: SeedCategory[] = [
  {
    name: "漢堡(蛋堡)",
    items: [
      { name: "卡啦雞腿蛋(辣)", price: 60 },
      { name: "黃金雞腿蛋(不辣)", price: 60 },
      { name: "總匯蛋堡", price: 50 },
      { name: "培根火腿蛋堡", price: 50 },
      { name: "黑胡椒豬排蛋堡", price: 45 },
      { name: "花枝排蛋堡", price: 45 },
      { name: "豬肉蛋堡", price: 40 },
      { name: "香雞蛋堡", price: 40 },
      { name: "培根蛋堡", price: 40 },
      { name: "鮪魚洋蔥沙拉蛋堡", price: 35 },
      { name: "火腿蛋堡", price: 35 },
      { name: "起司蛋堡", price: 30 },
      { name: "肉鬆蛋堡", price: 30 },
    ],
  },
  {
    name: "總匯",
    items: [
      { name: "豬排總匯", price: 65 },
      { name: "鮪魚肉鬆蛋總匯", price: 55 },
      { name: "漢堡肉總匯", price: 55 },
    ],
  },
  {
    name: "烤吐司(+蛋)",
    items: [
      { name: "卡啦雞腿(辣)+蛋", price: 55 },
      { name: "黃金雞腿(不辣)+蛋", price: 55 },
      { name: "培根+火腿+蛋", price: 45 },
      { name: "黑胡椒豬排+蛋", price: 40 },
      { name: "鮪魚+肉鬆+蛋", price: 40 },
      { name: "豬肉+蛋", price: 35 },
      { name: "培根+蛋", price: 35 },
      { name: "鮪魚洋蔥沙拉+蛋", price: 35 },
      { name: "火腿+蛋", price: 30 },
      { name: "玉米+蛋", price: 30 },
      { name: "起司+蛋", price: 25 },
      { name: "肉鬆+蛋", price: 20 },
    ],
  },
  {
    name: "蛋餅",
    items: [
      { name: "烤煎蛋", price: 20 },
      { name: "⚠️ 豬排夾蛋餅", price: 45 },
      { name: "鮪魚洋蔥沙拉蛋餅", price: 40 },
      { name: "火腿蛋餅", price: 35 },
      { name: "⚠️ 玉米蛋餅", price: 35 },
      { name: "⚠️ 起司蛋餅", price: 30 },
      { name: "肉鬆蛋餅", price: 30 },
      { name: "原味蛋餅", price: 22 },
    ],
  },
  {
    name: "丹麥吐司(+蛋)",
    items: [
      { name: "卡啦雞腿(辣)+蛋", price: 60 },
      { name: "黃金雞腿(不辣)+蛋", price: 60 },
      { name: "黑胡椒豬排+蛋", price: 50 },
      { name: "鮪魚洋蔥沙拉+蛋", price: 45 },
      { name: "培根+蛋", price: 45 },
      { name: "火腿+蛋", price: 45 },
      { name: "⚠️ 起司+蛋", price: 45 },
      { name: "⚠️ 肉鬆+蛋", price: 45 },
    ],
  },
  {
    name: "酥皮薄片",
    items: [
      { name: "培根", price: 35 },
      { name: "火腿", price: 35 },
      { name: "起司", price: 30 },
      { name: "玉米", price: 30 },
      { name: "肉鬆", price: 30 },
      { name: "巧克力", price: 25 },
      { name: "花生", price: 25 },
      { name: "草莓", price: 25 },
      { name: "藍莓", price: 25 },
      { name: "椰香", price: 25 },
      { name: "奶油", price: 25 },
    ],
  },
  {
    name: "烤厚片 — 鹹口味",
    items: [
      { name: "焗烤培根厚片", price: 40 },
      { name: "培根+起司", price: 40 },
      { name: "⚠️ 玉米+起司", price: 30 },
      { name: "起司", price: 30 },
      { name: "玉米", price: 30 },
      { name: "香蒜", price: 30 },
    ],
  },
  {
    name: "烤厚片 — 甜口味",
    items: [
      { name: "杏仁椰香", price: 40 },
      { name: "杏仁花生", price: 40 },
      { name: "杏仁巧酥", price: 40 },
      { name: "花生", price: 30 },
      { name: "巧克力", price: 25 },
      { name: "草莓", price: 25 },
      { name: "藍莓", price: 25 },
      { name: "椰香", price: 20 },
      { name: "奶油", price: 20 },
    ],
  },
  {
    name: "薄片",
    items: [
      { name: "巧克力薄片", price: 15 },
      { name: "花生薄片", price: 15 },
      { name: "藍莓薄片", price: 15 },
      { name: "草莓薄片", price: 15 },
      { name: "⚠️ 櫻桃薄片", price: 15 },
    ],
  },
  {
    name: "鐵板麵 / 其他主食",
    items: [
      { name: "黑胡椒鐵板麵", price: 35 },
      { name: "蘑菇鐵板麵", price: 30 },
      { name: "蔥抓餅", price: 30 },
      { name: "蘿蔔糕(兩塊)", price: 30 },
    ],
  },
  {
    name: "單點",
    items: [
      { name: "雞塊(一份五塊)", price: 35 },
      { name: "熱狗(四條)", price: 20 },
      { name: "薯餅(一塊)", price: 20 },
      { name: "黑胡椒豬排", price: 25 },
      { name: "漢堡肉", price: 20 },
      { name: "玉米蛋", price: 20 },
      { name: "火腿", price: 15 },
      { name: "培根", price: 15 },
      { name: "蔥蛋", price: 15 },
      { name: "荷包蛋", price: 12 },
    ],
  },
];

// 飲料以「中杯」當作品項基本價,尺寸用客製化選項處理(大杯 = 中杯 + 價差)。
type SeedDrink = { name: string; medium: number; large: number };

const drinks: SeedDrink[] = [
  { name: "紅茶", medium: 15, large: 20 },
  { name: "⚠️ 奶茶", medium: 20, large: 25 },
  { name: "豆漿", medium: 25, large: 30 },
  { name: "鮮奶茶", medium: 30, large: 35 },
  { name: "⚠️ 咖啡", medium: 20, large: 25 },
  { name: "柳橙汁", medium: 30, large: 35 },
  { name: "⚠️ 檸檬紅茶", medium: 20, large: 25 },
  { name: "⚠️ 檸檬汁", medium: 25, large: 30 },
  { name: "⚠️ 薏仁漿", medium: 25, large: 30 },
  { name: "(夏)綠豆沙", medium: 35, large: 50 },
  { name: "⚠️ 研磨咖啡", medium: 35, large: 45 },
];

// 這幾個分類的品項可以加購「加蛋」,示範客製化選項機制怎麼運作。
const ADD_EGG_CATEGORIES = new Set(["蛋餅", "鐵板麵 / 其他主食"]);

async function main() {
  console.log("清空現有菜單資料…");
  await prisma.orderItemOption.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.option.deleteMany();
  await prisma.optionGroup.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();

  for (const [categoryIndex, category] of categories.entries()) {
    const createdCategory = await prisma.menuCategory.create({
      data: { name: category.name, sortOrder: categoryIndex },
    });

    for (const [itemIndex, item] of category.items.entries()) {
      const menuItem = await prisma.menuItem.create({
        data: {
          categoryId: createdCategory.id,
          name: item.name,
          price: item.price,
          sortOrder: itemIndex,
        },
      });

      if (ADD_EGG_CATEGORIES.has(category.name)) {
        await prisma.optionGroup.create({
          data: {
            menuItemId: menuItem.id,
            name: "加購",
            required: false,
            multiple: true,
            options: {
              create: [{ name: "加蛋", extraPrice: 10 }],
            },
          },
        });
      }
    }
  }

  const drinkCategory = await prisma.menuCategory.create({
    data: { name: "飲料", sortOrder: categories.length },
  });

  for (const [drinkIndex, drink] of drinks.entries()) {
    const menuItem = await prisma.menuItem.create({
      data: {
        categoryId: drinkCategory.id,
        name: drink.name,
        price: drink.medium,
        sortOrder: drinkIndex,
      },
    });

    await prisma.optionGroup.create({
      data: {
        menuItemId: menuItem.id,
        name: "尺寸",
        required: true,
        multiple: false,
        options: {
          create: [
            { name: "中杯", extraPrice: 0, sortOrder: 0 },
            { name: "大杯", extraPrice: drink.large - drink.medium, sortOrder: 1 },
          ],
        },
      },
    });
  }

  const itemCount = await prisma.menuItem.count();
  console.log(`完成:${categories.length + 1} 個分類、${itemCount} 個品項`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
