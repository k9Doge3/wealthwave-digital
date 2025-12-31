import { prisma } from "@/lib/db";
import { ProductType } from "../../generated/prisma";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const courses = await prisma.product.findMany({
    where: { isActive: true, type: ProductType.COURSE },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      priceCents: true,
      currency: true,
      type: true,
    },
  });

  return (
    <div className="container-page">
      <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
      <div className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <ProductCard key={c.id} product={c} />
        ))}
      </div>
    </div>
  );
}
