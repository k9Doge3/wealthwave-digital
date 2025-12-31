import { PrismaClient } from "../generated/prisma";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function shouldUseSslForConnectionString(connectionString: string): boolean {
  const lowered = connectionString.toLowerCase();

  // Respect explicit opt-out.
  const sslMode = process.env.PGSSLMODE?.toLowerCase();
  if (sslMode === "disable") return false;
  if (lowered.includes("sslmode=disable")) return false;
  if (lowered.includes("ssl=false")) return false;

  // Supabase Postgres requires SSL for internet connections.
  // Only force SSL when we can confidently detect Supabase hosts.
  try {
    const url = new URL(connectionString);
    const hostname = url.hostname.toLowerCase();
    return hostname.endsWith(".supabase.co") || hostname.endsWith(".pooler.supabase.com");
  } catch {
    // If parsing fails, avoid forcing SSL.
    return false;
  }
}

function createPrismaClient() {
  if (process.env.PRISMA_ACCELERATE_URL) {
    return new PrismaClient({ accelerateUrl: process.env.PRISMA_ACCELERATE_URL });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL");
  }

  // Log the connection target without leaking credentials.
  // This is especially helpful in serverless environments where env vars can differ per deployment.
  try {
    const url = new URL(databaseUrl);
    const dbName = url.pathname?.replace(/^\//, "") || "(none)";
    const port = url.port || "(default)";
    console.info("[db] DATABASE_URL target", {
      host: url.hostname,
      port,
      db: dbName,
    });
  } catch {
    console.info("[db] DATABASE_URL target", { host: "(unparseable)" });
  }

  const maxFromEnv = process.env.PGPOOL_MAX ? Number(process.env.PGPOOL_MAX) : undefined;
  const max = Number.isFinite(maxFromEnv)
    ? (maxFromEnv as number)
    : process.env.NODE_ENV === "production"
      ? 1
      : 10;

  const useSsl = process.env.NODE_ENV === "production" && shouldUseSslForConnectionString(databaseUrl);
  const pool = new Pool({
    connectionString: databaseUrl,
    max,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
