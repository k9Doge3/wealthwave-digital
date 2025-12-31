import Link from "next/link";

import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/ProductCard";
import { FaqAccordion } from "@/components/FaqAccordion";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { PRODUCT_CATALOG, partitionByCategory } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function Home() {
  const slugs = PRODUCT_CATALOG.map((p) => p.slug);
  const products = await prisma.product.findMany({
    where: { isActive: true, slug: { in: slugs } },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      priceCents: true,
      currency: true,
      type: true,
    },
  });

  const productsBySlug = new Map(products.map((p) => [p.slug, p] as const));
  const ordered = slugs
    .map((slug) => productsBySlug.get(slug))
    .filter((p): p is NonNullable<(typeof products)[number]> => Boolean(p));

  const { money, business } = partitionByCategory(ordered);

  const featured = productsBySlug.get("the-prudent-investors-framework") ?? null;

  return (
    <div className="container-page">
      {/* 1) Hero */}
      <section className="grid items-start gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="pill pill-muted">Premium knowledge products</div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Build Wealth Through Digital Mastery
          </h1>
          <p className="mt-4 text-base text-muted">
            Actionable frameworks for investing intelligently and building profitable
            online businesses. No fluff, just proven systems.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="#money-mastery"
              className="btn btn-primary px-6 py-3 text-base"
            >
              View Money Mastery Guides
            </Link>
            <Link href="#business-builder" className="btn px-6 py-3 text-base">
              Explore Business Systems
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <span className="pill pill-muted">Instant digital delivery</span>
            <span className="pill pill-muted">30-day guarantee</span>
            <span className="pill pill-muted">Lifetime access</span>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="badge">Abstract data visualization</div>
                <div className="mt-1 text-sm font-semibold">Signal over noise</div>
                <div className="mt-1 text-sm text-muted">
                  Frameworks designed for real decisions.
                </div>
              </div>
              <span className="pill pill-accent">Trusted systems</span>
            </div>

            <div className="mt-6">
              <svg
                viewBox="0 0 560 220"
                role="img"
                aria-label="Abstract chart"
                className="h-auto w-full"
                preserveAspectRatio="xMidYMid meet"
              >
                <g fill="none" stroke="currentColor" strokeOpacity="0.10">
                  <path d="M20 190H540" />
                  <path d="M20 150H540" />
                  <path d="M20 110H540" />
                  <path d="M20 70H540" />
                  <path d="M20 30H540" />
                </g>

                <path
                  d="M20 160 C 90 170, 130 110, 180 118 C 230 126, 255 78, 300 82 C 350 86, 385 138, 420 128 C 455 118, 490 80, 540 58"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity="0.55"
                />
                <path
                  d="M20 175 C 95 150, 140 160, 190 145 C 240 130, 270 155, 315 140 C 360 125, 395 110, 440 118 C 485 126, 510 98, 540 90"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity="0.22"
                />

                <g fill="var(--accent)" opacity="0.9">
                  <circle cx="180" cy="118" r="4" />
                  <circle cx="300" cy="82" r="4" />
                  <circle cx="420" cy="128" r="4" />
                  <circle cx="540" cy="58" r="4" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 2) Featured flagship */}
      {featured ? (
        <section className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Featured</h2>
              <p className="mt-2 text-sm text-muted">
                Start with the flagship framework.
              </p>
            </div>
            <Link href="#money-mastery" className="btn">
              View Money Mastery
            </Link>
          </div>

          <div className="mt-6 card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="pill pill-accent">MOST POPULAR</span>
              <span className="pill pill-muted">Instant Digital Delivery</span>
              <span className="pill pill-muted">PREMIUM GUIDE</span>
            </div>

            <div className="mt-4 grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <h3 className="text-xl font-semibold tracking-tight">
                  {featured.name}
                </h3>
                <p className="mt-2 text-sm text-muted">
                  {featured.description}
                </p>
              </div>
              <div className="lg:col-span-4">
                <div className="rounded-xl border bg-transparent p-4">
                  <div className="badge">Price</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {formatMoney(featured.priceCents, featured.currency)}
                  </div>
                  <div className="mt-1 text-sm text-muted">
                    One-time payment. Lifetime access.
                  </div>
                  <div className="mt-4">
                    <Link href="#money-mastery" className="btn btn-primary w-full">
                      Get the Framework →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* 3) Master Your Money */}
      <section id="money-mastery" className="mt-14">
        <h2 className="text-2xl font-semibold tracking-tight">Master Your Money</h2>
        <p className="mt-2 text-sm text-muted">
          Risk-first investing frameworks designed for long-term wealth.
        </p>
        <div className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {money.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* 4) Build Your Online Business */}
      <section id="business-builder" className="mt-14">
        <h2 className="text-2xl font-semibold tracking-tight">
          Build Your Online Business
        </h2>
        <p className="mt-2 text-sm text-muted">
          Systems for audience growth, offer creation, and automated sales.
        </p>
        <div className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {business.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* 5) FAQ */}
      <section className="mt-14">
        <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
        <p className="mt-2 text-sm text-muted">
          Everything you need to know before buying.
        </p>
        <div className="mt-6">
          <FaqAccordion />
        </div>
      </section>

      {/* 6) Newsletter */}
      <section className="mt-14">
        <NewsletterSignup />
      </section>
    </div>
  );
}
