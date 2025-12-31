import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <div className="container-narrow">
      <h1 className="text-2xl font-semibold tracking-tight">Payment successful</h1>
      <p className="mt-3 text-sm text-muted">
        Thanks! If you bought a course, access will appear in your account.
      </p>
      <div className="mt-6 flex gap-3">
        <Link className="btn btn-primary" href="/account">
          Go to account
        </Link>
        <Link className="btn" href="/products">
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
