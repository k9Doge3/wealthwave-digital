"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import { formatMoney } from "@/lib/money";

type CartItem = { productId: string; quantity: number };

type Product = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  type: string;
};

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem("cart");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x) =>
          x &&
          typeof x === "object" &&
          typeof x.productId === "string" &&
          typeof x.quantity === "number"
      )
      .map((x) => ({ productId: x.productId, quantity: x.quantity }));
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  localStorage.setItem("cart", JSON.stringify(items));
}

export function CartClient() {
  const { data: session, status } = useSession();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCart(readCart());
  }, []);

  useEffect(() => {
    const ids = cart.map((i) => i.productId);
    if (ids.length === 0) {
      setProducts([]);
      return;
    }

    setLoadingProducts(true);
    fetch(`/api/products?ids=${encodeURIComponent(ids.join(","))}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(Array.isArray(data?.products) ? data.products : []);
      })
      .catch(() => {
        setProducts([]);
      })
      .finally(() => setLoadingProducts(false));
  }, [cart]);

  const quantityById = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of cart) map.set(i.productId, i.quantity);
    return map;
  }, [cart]);

  const lineItems = useMemo(() => {
    return products
      .map((p) => ({ product: p, quantity: quantityById.get(p.id) ?? 0 }))
      .filter((x) => x.quantity > 0);
  }, [products, quantityById]);

  const total = useMemo(() => {
    if (lineItems.length === 0) return { cents: 0, currency: "usd" };
    const currency = lineItems[0].product.currency;
    const cents = lineItems.reduce(
      (sum, li) => sum + li.product.priceCents * li.quantity,
      0
    );
    return { cents, currency };
  }, [lineItems]);

  if (cart.length === 0) {
    return (
      <div className="card">
        <p className="text-sm text-muted">Your cart is empty.</p>
        <Link className="mt-3 inline-block link" href="/products">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Items</div>
          {loadingProducts ? (
            <div className="text-sm text-muted">Loading…</div>
          ) : null}
        </div>

        <div className="mt-4 space-y-3">
          {lineItems.map(({ product, quantity }) => (
            <div
              key={product.id}
              className="flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="badge">
                  {product.type}
                </div>
                <div className="truncate text-sm font-semibold">
                  {quantity}× {product.name}
                </div>
                <div className="mt-1 text-xs text-muted">
                  {formatMoney(product.priceCents, product.currency)} each
                </div>
              </div>

              <button
                type="button"
                className="btn btn-xs"
                onClick={() => {
                  const next = cart
                    .map((c) =>
                      c.productId === product.id
                        ? { ...c, quantity: Math.max(0, c.quantity - 1) }
                        : c
                    )
                    .filter((c) => c.quantity > 0);
                  writeCart(next);
                  setCart(next);
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between divider pt-4">
          <div className="text-sm font-semibold">Total</div>
          <div className="text-sm font-semibold">
            {formatMoney(total.cents, total.currency)}
          </div>
        </div>
      </div>

      {error ? <div className="text-sm text-red-700">{error}</div> : null}

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          className="btn"
          onClick={() => {
            writeCart([]);
            setCart([]);
          }}
        >
          Clear cart
        </button>

        {status === "loading" ? (
          <div className="text-sm text-muted">Checking session…</div>
        ) : session?.user?.id ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={checkoutLoading}
            onClick={async () => {
              setError(null);
              setCheckoutLoading(true);
              try {
                const res = await fetch("/api/checkout", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    items: cart,
                  }),
                });

                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                  setError(data?.error ?? "Checkout failed");
                  setCheckoutLoading(false);
                  return;
                }

                if (data?.url) {
                  window.location.href = data.url;
                } else {
                  setError("Checkout failed");
                }
              } catch {
                setError("Checkout failed");
              } finally {
                setCheckoutLoading(false);
              }
            }}
          >
            {checkoutLoading ? "Redirecting…" : "Checkout"}
          </button>
        ) : (
          <Link
            className="btn btn-primary"
            href="/login?next=/cart"
          >
            Login to checkout
          </Link>
        )}
      </div>
    </div>
  );
}
