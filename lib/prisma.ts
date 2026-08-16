import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Vercel's Prisma Postgres integration provides DATABASE_URL as an
// Accelerate-proxy URL that the plain `pg` driver can't parse; the direct
// TCP connection string it also provides (DATABASE_POSTGRES_URL) is what
// @prisma/adapter-pg needs. Local dev (`prisma dev`) only sets DATABASE_URL.
const connectionString =
  process.env.DATABASE_POSTGRES_URL ?? process.env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
