import Link from "next/link";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";

export async function NavBar() {
  const session = await getServerSession(authOptions);

  return (
    <header className="border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          WealthWave Digital
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/products" className="link no-underline hover:underline">
            Products
          </Link>
          <Link href="/courses" className="link no-underline hover:underline">
            Courses
          </Link>
          <Link href="/cart" className="link no-underline hover:underline">
            Cart
          </Link>
          {session?.user?.id ? (
            <Link href="/account" className="link no-underline hover:underline">
              Account
            </Link>
          ) : (
            <>
              <Link href="/login" className="link no-underline hover:underline">
                Login
              </Link>
              <Link href="/signup" className="link no-underline hover:underline">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
