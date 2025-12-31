"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      type="button"
      className="btn btn-sm"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Log out
    </button>
  );
}
