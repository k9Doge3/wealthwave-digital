import { CartClient } from "@/components/CartClient";

export default function CartPage() {
  return (
    <div className="container-page">
      <h1 className="text-2xl font-semibold tracking-tight">Cart</h1>
      <div className="mt-6">
        <CartClient />
      </div>
      <p className="mt-6 text-sm text-muted">
        Checkout requires an account (login first).
      </p>
    </div>
  );
}
