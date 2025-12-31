import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

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
    const vercelId = req.headers.get("x-vercel-id");
    if (vercelId) {
      console.info("/api/checkout request", { vercelId });
    }

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

    // Connectivity probe (unauthenticated) to catch DNS/egress issues early.
    // If this fails, the Stripe SDK will also fail.
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5_000);
      const res = await fetch("https://api.stripe.com", {
        method: "GET",
        signal: controller.signal,
        headers: {
          "user-agent": "wealthwave-digital/checkout-probe",
        },
      });
      clearTimeout(timeout);
      console.info("Stripe connectivity probe", { status: res.status });
    } catch (probeError) {
      const probeMessage = probeError instanceof Error ? probeError.message : String(probeError);
      console.error("Stripe connectivity probe failed", { message: probeMessage });
      return NextResponse.json(
        {
          error:
            "Cannot reach Stripe from the server (network/DNS). Check Vercel logs/region and try again.",
        },
        { status: 502 }
      );
    }

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
    const stripeType = (error as { type?: unknown } | null)?.type;
    const stripeRawCode = (error as { raw?: { code?: unknown } } | null)?.raw?.code;

    console.error("/api/checkout failed", {
      code: typeof code === "string" ? code : undefined,
      message,
      stripeType: typeof stripeType === "string" ? stripeType : undefined,
      stripeCode: typeof stripeRawCode === "string" ? stripeRawCode : undefined,
    });

    // Provide safe, actionable errors without leaking secrets.
    if (message.includes("Missing STRIPE_SECRET_KEY")) {
      return NextResponse.json(
        { error: "Checkout is not configured (missing STRIPE_SECRET_KEY)." },
        { status: 500 }
      );
    }

    if (message.includes("Missing DATABASE_URL")) {
      return NextResponse.json(
        { error: "Checkout is not configured (missing DATABASE_URL)." },
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

    if (
      message.toLowerCase().includes("connection to stripe") ||
      message.toLowerCase().includes("econnreset") ||
      message.toLowerCase().includes("etimedout") ||
      message.toLowerCase().includes("enotfound")
    ) {
      return NextResponse.json(
        {
          error:
            "Stripe connection error. Check Vercel logs and verify the function is running in Node.js (not Edge).",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "Checkout failed (server error). Check server logs." },
      { status: 500 }
    );
  }
}
