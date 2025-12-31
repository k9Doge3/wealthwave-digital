import { AddToCartButton } from "@/components/AddToCartButton";
import { formatMoney } from "@/lib/money";
import { getProductMeta } from "@/lib/catalog";

export function ProductCard({
  product,
}: {
  product: {
    id: string;
    slug: string;
    name: string;
    description: string;
    priceCents: number;
    currency: string;
    type: string;
  };
}) {
  const meta = getProductMeta(product.slug);

  return (
    <div className="card flex h-full flex-col">
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill pill-muted">
            {meta?.categoryLabel ?? "Digital"}
          </span>
          {meta?.highlightBadge ? (
            <span className="pill pill-accent">{meta.highlightBadge}</span>
          ) : null}
          <span className="pill pill-muted">Instant Digital Delivery</span>
        </div>

        <div className="mt-3 badge">{meta?.typeLabel ?? "DIGITAL"}</div>
        <h3 className="mt-1 text-base font-semibold leading-snug">
          {product.name}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-muted clamp-2">
          {product.description}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-base font-semibold">
          {formatMoney(product.priceCents, product.currency)}
        </div>
        <AddToCartButton
          productId={product.id}
          label={meta?.ctaLabel ?? "Get instant access →"}
          className="btn btn-primary btn-sm"
        />
      </div>
    </div>
  );
}
