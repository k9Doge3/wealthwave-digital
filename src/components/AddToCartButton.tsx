"use client";

import { useMemo, useState } from "react";

type CartItem = { productId: string; quantity: number };

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem("cart");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x) =>
        x &&
        typeof x === "object" &&
        typeof x.productId === "string" &&
        typeof x.quantity === "number"
    );
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  localStorage.setItem("cart", JSON.stringify(items));
}

export function AddToCartButton({
  productId,
  label = "Add to cart",
  addedLabel = "Added",
  className = "btn btn-sm",
}: {
  productId: string;
  label?: string;
  addedLabel?: string;
  className?: string;
}) {
  const [added, setAdded] = useState(false);

  const computedLabel = useMemo(
    () => (added ? addedLabel : label),
    [added, addedLabel, label]
  );

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const current = readCart();
        const existing = current.find((i) => i.productId === productId);
        if (existing) {
          existing.quantity += 1;
          writeCart([...current]);
        } else {
          writeCart([...current, { productId, quantity: 1 }]);
        }
        setAdded(true);
        setTimeout(() => setAdded(false), 900);
      }}
    >
      {computedLabel}
    </button>
  );
}
