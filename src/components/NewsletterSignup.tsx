"use client";

import { useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  return (
    <div className="card">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold tracking-tight">
          Get Weekly Wealth Building Insights
        </h3>
        <p className="text-sm text-muted">
          Short, actionable lessons on investing, risk, and online business systems.
        </p>
      </div>

      <form
        className="mt-5 flex flex-col gap-3 sm:flex-row"
        onSubmit={async (e) => {
          e.preventDefault();
          setStatus("loading");

          try {
            const res = await fetch("/api/newsletter", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ email }),
            });

            if (!res.ok) {
              setStatus("error");
              return;
            }

            setEmail("");
            setStatus("success");
          } catch {
            setStatus("error");
          }
        }}
      >
        <label className="flex-1">
          <span className="sr-only">Email</span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>
        <button
          type="submit"
          className="btn btn-primary sm:whitespace-nowrap"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Submitting…" : "Subscribe"}
        </button>
      </form>

      {status === "success" ? (
        <p className="mt-3 text-sm">You're in — check your inbox soon.</p>
      ) : null}
      {status === "error" ? (
        <p className="mt-3 text-sm text-red-700">
          Something went wrong. Please try again.
        </p>
      ) : null}
    </div>
  );
}
