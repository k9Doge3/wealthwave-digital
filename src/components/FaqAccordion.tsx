"use client";

import { useMemo, useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

export function FaqAccordion() {
  const items = useMemo<FaqItem[]>(
    () => [
      {
        question: "How do I access the guides?",
        answer:
          "Instant PDF download after purchase, plus bonus resource links delivered to your email.",
      },
      {
        question: "Are these updated regularly?",
        answer:
          "Yes. Major updates are free for existing customers — you keep lifetime access.",
      },
      {
        question: "What's your refund policy?",
        answer: "30-day money-back guarantee.",
      },
      {
        question: "Are there any ongoing costs?",
        answer: "No — one-time payment for lifetime access.",
      },
      {
        question: "Can I ask questions about the content?",
        answer: "Yes — email support is included.",
      },
    ],
    []
  );

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const open = openIndex === idx;
        return (
          <div key={item.question} className="card">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 text-left"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? null : idx)}
            >
              <span className="text-sm font-semibold">{item.question}</span>
              <span className="text-muted">{open ? "–" : "+"}</span>
            </button>
            {open ? (
              <p className="mt-3 text-sm text-muted">{item.answer}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
