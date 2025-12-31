import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { LogoutButton } from "@/app/account/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?next=/account");
  }

  const [enrollments, orders] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId: session.user.id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="container-page">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
          <p className="mt-1 text-sm text-muted">{session.user.email}</p>
        </div>
        <LogoutButton />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Your courses</h2>
        {enrollments.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No course access yet. Browse <Link href="/courses" className="link">courses</Link>.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {enrollments.map((e) => (
              <div key={e.id} className="card">
                <div className="font-semibold">{e.product.name}</div>
                <div className="mt-1 text-sm text-muted">Access granted</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Recent orders</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No orders yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="card">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-semibold">{o.status.toUpperCase()}</div>
                  <div className="text-sm font-semibold">
                    {formatMoney(o.totalCents, o.currency)}
                  </div>
                </div>
                <div className="mt-2 text-sm text-muted">
                  {o.items.map((i) => (
                    <div key={i.id}>
                      {i.quantity}× {i.product.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
