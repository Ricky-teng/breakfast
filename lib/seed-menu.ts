import type { PrismaClient } from "@/app/generated/prisma/client";
import { categories, drinks, ADD_EGG_CATEGORIES } from "./seed-menu-data";

export async function seedMenu(prisma: PrismaClient) {
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
            {
              name: "大杯",
              extraPrice: drink.large - drink.medium,
              sortOrder: 1,
            },
          ],
        },
      },
    });
  }

  return prisma.menuItem.count();
}
