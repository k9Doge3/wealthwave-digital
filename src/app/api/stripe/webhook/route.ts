import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { ProductType } from "../../../../generated/prisma";
import { formatMoney } from "@/lib/money";
import { sendAdminPurchaseEmail } from "@/lib/email";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  const payload = await req.text();

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const becamePaid = order.status !== "paid";

    if (becamePaid) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "paid",
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
        },
      });

      const courseProductIds = order.items
        .filter((i) => i.product.type === ProductType.COURSE)
        .map((i) => i.productId);

      for (const productId of courseProductIds) {
        await prisma.enrollment.upsert({
          where: {
            userId_productId: {
              userId: order.userId,
              productId,
            },
          },
          update: {},
          create: {
            userId: order.userId,
            productId,
          },
        });
      }
    }

    // Best-effort admin notification email (never fail webhook)
    try {
      const adminEmail = process.env.SMTP_EMAIL;
      if (adminEmail) {
        const user = await prisma.user.findUnique({
          where: { id: order.userId },
          select: { email: true },
        });

        await sendAdminPurchaseEmail({
          adminEmail,
          orderId: order.id,
          orderStatus: becamePaid ? "paid" : order.status,
          total: formatMoney(order.totalCents, order.currency),
          userId: order.userId,
          userEmail: user?.email ?? null,
          stripeSessionId: session.id ?? null,
          stripePaymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
          customerEmail: session.customer_details?.email ?? null,
          customerName: session.customer_details?.name ?? null,
          lineItems: order.items.map((i) => ({
            name: i.product.name,
            quantity: i.quantity,
            unit: formatMoney(i.unitPriceCents, i.product.currency),
          })),
        });
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ received: true });
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await prisma.order.updateMany({
        where: { id: orderId, status: "pending" },
        data: { status: "expired" },
      });
    }
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
