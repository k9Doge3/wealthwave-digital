import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

const cartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = cartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
  }

  const items = parsed.data.items;
  const products = await prisma.product.findMany({
    where: {
      id: { in: items.map((i) => i.productId) },
      isActive: true,
    },
  });

  const productById = new Map(products.map((p) => [p.id, p] as const));

  const orderItems = items.map((i) => {
    const product = productById.get(i.productId);
    if (!product) throw new Error("Invalid product in cart");
    return {
      product,
      quantity: i.quantity,
      unitPriceCents: product.priceCents,
    };
  });

  const currency = orderItems[0]?.product.currency ?? "usd";
  const totalCents = orderItems.reduce(
    (sum, i) => sum + i.unitPriceCents * i.quantity,
    0
  );

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      status: "pending",
      totalCents,
      currency,
      items: {
        create: orderItems.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          unitPriceCents: i.unitPriceCents,
        })),
      },
    },
    include: {
      items: { include: { product: true } },
    },
  });

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    req.headers.get("origin") ??
    "http://localhost:3000";

  const stripe = getStripe();

  const stripeSession = await stripe.checkout.sessions.create({
    mode: "payment",
    metadata: {
      orderId: order.id,
      userId: session.user.id,
    },
    line_items: order.items.map((i) => ({
      quantity: i.quantity,
      price_data: {
        currency: i.product.currency,
        unit_amount: i.unitPriceCents,
        product_data: {
          name: i.product.name,
          description: i.product.description,
        },
      },
    })),
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancel`,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      stripeCheckoutSessionId: stripeSession.id,
    },
  });

  return NextResponse.json({ url: stripeSession.url });
}
