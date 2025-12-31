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
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

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
      if (!product) {
        return null;
      }
      return {
        product,
        quantity: i.quantity,
        unitPriceCents: product.priceCents,
      };
    });

    if (orderItems.some((i) => i === null)) {
      return NextResponse.json({ error: "Invalid product in cart" }, { status: 400 });
    }

    const normalizedOrderItems = orderItems.filter(
      (i): i is NonNullable<(typeof orderItems)[number]> => Boolean(i)
    );

    const currency = normalizedOrderItems[0]?.product.currency ?? "usd";
    const totalCents = normalizedOrderItems.reduce(
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
          create: normalizedOrderItems.map((i) => ({
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code = (error as { code?: unknown } | null)?.code;

    console.error("/api/checkout failed", {
      code: typeof code === "string" ? code : undefined,
      message,
    });

    // Provide safe, actionable errors without leaking secrets.
    if (message.includes("Missing STRIPE_SECRET_KEY")) {
      return NextResponse.json(
        { error: "Checkout is not configured (missing STRIPE_SECRET_KEY)." },
        { status: 500 }
      );
    }

    if (
      typeof code === "string" &&
      (code === "P1001" || code === "P1000" || code === "P2021")
    ) {
      return NextResponse.json(
        {
          error:
            "Checkout database error. Check Vercel env vars (DATABASE_URL) and migrations.",
        },
        { status: 500 }
      );
    }

    if (
      message.toLowerCase().includes("success_url") ||
      message.toLowerCase().includes("cancel_url") ||
      message.toLowerCase().includes("invalid url")
    ) {
      return NextResponse.json(
        {
          error:
            "Checkout redirect URL is invalid. Set NEXT_PUBLIC_APP_URL to your deployed https URL.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Checkout failed (server error). Check server logs." },
      { status: 500 }
    );
  }
}
