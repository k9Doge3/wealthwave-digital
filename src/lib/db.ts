import { PrismaClient } from "../generated/prisma";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  if (process.env.PRISMA_ACCELERATE_URL) {
    return new PrismaClient({ accelerateUrl: process.env.PRISMA_ACCELERATE_URL });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL");
  }

  if (databaseUrl.startsWith("file:")) {
    const filePath = databaseUrl.slice("file:".length);
    const adapter = new PrismaBetterSqlite3({ url: filePath });
    return new PrismaClient({ adapter });
  }

  throw new Error(
    "Prisma v7 requires a runtime adapter or PRISMA_ACCELERATE_URL. Configure PRISMA_ACCELERATE_URL for production."
  );
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
