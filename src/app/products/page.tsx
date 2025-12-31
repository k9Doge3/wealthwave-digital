import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/ProductCard";
import { PRODUCT_CATALOG, partitionByCategory, sortByCatalogOrder } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
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

  const ordered = sortByCatalogOrder(products);
  const { money, business } = partitionByCategory(ordered);

  return (
    <div className="container-page">
      <h1 className="text-2xl font-semibold tracking-tight">Products</h1>

      <section className="mt-6">
        <h2 className="text-xl font-semibold tracking-tight">Master Your Money</h2>
        <p className="mt-2 text-sm text-muted">
          Risk-first investing frameworks designed for long-term wealth.
        </p>
        <div className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {money.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight">
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
    </div>
  );
}
