import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient, ProductType } from "../src/generated/prisma";

function createPrismaClient() {
  if (process.env.PRISMA_ACCELERATE_URL) {
    return new PrismaClient({ accelerateUrl: process.env.PRISMA_ACCELERATE_URL });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("Missing DATABASE_URL");

  if (!databaseUrl.startsWith("file:")) {
    throw new Error(
      "Seeding currently supports SQLite (file:...) or PRISMA_ACCELERATE_URL."
    );
  }

  const filePath = databaseUrl.slice("file:".length);
  const adapter = new PrismaBetterSqlite3({ url: filePath });
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
