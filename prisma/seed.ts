import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient, ProductType } from "../src/generated/prisma";

function shouldUseSslForConnectionString(connectionString: string): boolean {
  const lowered = connectionString.toLowerCase();

  const sslMode = process.env.PGSSLMODE?.toLowerCase();
  if (sslMode === "disable") return false;
  if (lowered.includes("sslmode=disable")) return false;
  if (lowered.includes("ssl=false")) return false;

  if (lowered.includes("sslmode=require")) return true;

  try {
    const url = new URL(connectionString);
    const hostname = url.hostname.toLowerCase();
    return hostname.endsWith(".supabase.co") || hostname.endsWith(".pooler.supabase.com");
  } catch {
    return false;
  }
}

function createPrismaClient() {
  if (process.env.PRISMA_ACCELERATE_URL) {
    return new PrismaClient({ accelerateUrl: process.env.PRISMA_ACCELERATE_URL });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("Missing DATABASE_URL");

  // Seed against Postgres/Supabase.
  // Note: For migrations/seeding, prefer using the Supabase Direct connection string.
  const useSsl = shouldUseSslForConnectionString(databaseUrl);
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    max: 1,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function main() {
  const products = [
    // MONEY MASTERY
    {
      type: ProductType.MISC,
      slug: "the-prudent-investors-framework",
      name: "The Prudent Investor's Framework",
      description:
        "A systematic approach to managing risk, building diversified portfolios, and making informed investment decisions across all asset classes. Includes risk assessment templates and portfolio construction models.",
      priceCents: 9700,
      currency: "usd",
      isActive: true,
    },
    {
      type: ProductType.MISC,
      slug: "cryptocurrency-clarity-risk-first",
      name: "Cryptocurrency Clarity: A Risk-First Approach",
      description:
        "Navigate crypto markets with confidence. Learn risk management, fundamental analysis, and systematic trading strategies that prioritize capital preservation.",
      priceCents: 6700,
      currency: "usd",
      isActive: true,
    },
    {
      type: ProductType.MISC,
      slug: "automated-income-systems",
      name: "Automated Income Systems",
      description:
        "Build passive income streams through dividend investing, REITs, and automated trading strategies. Templates for tracking and scaling included.",
      priceCents: 7900,
      currency: "usd",
      isActive: true,
    },

    // ONLINE BUSINESS BUILDER
    {
      type: ProductType.COURSE,
      slug: "the-digital-business-launchpad",
      name: "The Digital Business Launchpad",
      description:
        "From zero to first $10k online. Covers niche selection, audience building, offer creation, and automated sales funnels. Includes funnel templates and validation checklists.",
      priceCents: 14900,
      currency: "usd",
      isActive: true,
    },
    {
      type: ProductType.MISC,
      slug: "audience-first-social-growth-engine",
      name: "Audience First: Social Growth Engine",
      description:
        "Build a loyal audience before launching products. Content systems, community building, and conversion strategies that work across all platforms.",
      priceCents: 5700,
      currency: "usd",
      isActive: true,
    },
  ];

  const activeSlugs = products.map((p) => p.slug);

  // Deactivate any previously seeded products not in the new catalog.
  await prisma.product.updateMany({
    where: { slug: { notIn: activeSlugs } },
    data: { isActive: false },
  });

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        type: product.type,
        name: product.name,
        description: product.description,
        priceCents: product.priceCents,
        currency: product.currency,
        isActive: product.isActive,
      },
      create: product,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
