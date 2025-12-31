export type ProductCategory = "MONEY_MASTERY" | "ONLINE_BUSINESS_BUILDER";

export type ProductMeta = {
  slug: string;
  category: ProductCategory;
  categoryLabel: string;
  typeLabel: string;
  ctaLabel: string;
  highlightBadge?: "MOST POPULAR" | "BEST VALUE";
  order: number;
};

export const PRODUCT_CATALOG: ProductMeta[] = [
  {
    slug: "the-prudent-investors-framework",
    category: "MONEY_MASTERY",
    categoryLabel: "Money Mastery",
    typeLabel: "PREMIUM GUIDE",
    ctaLabel: "Get the Framework →",
    highlightBadge: "MOST POPULAR",
    order: 1,
  },
  {
    slug: "cryptocurrency-clarity-risk-first",
    category: "MONEY_MASTERY",
    categoryLabel: "Money Mastery",
    typeLabel: "ADVANCED GUIDE",
    ctaLabel: "Get Crypto Clarity →",
    order: 2,
  },
  {
    slug: "automated-income-systems",
    category: "MONEY_MASTERY",
    categoryLabel: "Money Mastery",
    typeLabel: "STRATEGY GUIDE",
    ctaLabel: "Build Your System →",
    order: 3,
  },
  {
    slug: "the-digital-business-launchpad",
    category: "ONLINE_BUSINESS_BUILDER",
    categoryLabel: "Online Business Builder",
    typeLabel: "COMPLETE COURSE",
    ctaLabel: "Launch Your Business →",
    highlightBadge: "BEST VALUE",
    order: 1,
  },
  {
    slug: "audience-first-social-growth-engine",
    category: "ONLINE_BUSINESS_BUILDER",
    categoryLabel: "Online Business Builder",
    typeLabel: "IMPLEMENTATION GUIDE",
    ctaLabel: "Grow Your Audience →",
    order: 2,
  },
];

const metaBySlug = new Map(PRODUCT_CATALOG.map((m) => [m.slug, m] as const));

export function getProductMeta(slug: string | null | undefined): ProductMeta | null {
  if (!slug) return null;
  return metaBySlug.get(slug) ?? null;
}

export function sortByCatalogOrder<T extends { slug: string }>(items: T[]) {
  const order = (slug: string) => {
    const meta = getProductMeta(slug);
    return meta ? meta.order : 999;
  };

  return [...items].sort((a, b) => order(a.slug) - order(b.slug));
}

export function partitionByCategory<T extends { slug: string }>(items: T[]) {
  const money: T[] = [];
  const business: T[] = [];

  for (const item of items) {
    const meta = getProductMeta(item.slug);
    if (!meta) continue;

    if (meta.category === "MONEY_MASTERY") money.push(item);
    if (meta.category === "ONLINE_BUSINESS_BUILDER") business.push(item);
  }

  return {
    money: sortByCatalogOrder(money),
    business: sortByCatalogOrder(business),
  };
}
