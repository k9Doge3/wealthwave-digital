import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";

const querySchema = z.object({
  ids: z.string().min(1),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ products: [] });
  }

  const ids = parsed.data.ids
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      currency: true,
      type: true,
    },
  });

  return NextResponse.json({ products });
}
