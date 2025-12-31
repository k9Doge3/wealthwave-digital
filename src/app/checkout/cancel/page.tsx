import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="container-narrow">
      <h1 className="text-2xl font-semibold tracking-tight">Checkout canceled</h1>
      <p className="mt-3 text-sm text-muted">
        No worries — your cart is still here.
      </p>
      <div className="mt-6 flex gap-3">
        <Link className="btn btn-primary" href="/cart">
          Back to cart
        </Link>
        <Link className="btn" href="/products">
          Browse products
        </Link>
      </div>
    </div>
  );
}
