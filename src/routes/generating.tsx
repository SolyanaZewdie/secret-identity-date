import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LOADING_LINES } from "@/lib/lela/data";

export const Route = createFileRoute("/generating")({
  head: () => ({
    meta: [
      { title: "Finding your identities — LELA" },
      { name: "description", content: "LELA is searching the archives for tonight's characters." },
      { property: "og:title", content: "Finding your identities — LELA" },
      { property: "og:description", content: "Choosing someone you definitely weren't expecting." },
    ],
  }),
  component: Generating,
});

function Generating() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setIndex((i) => Math.min(i + 1, LOADING_LINES.length - 1));
    }, 900);
    const done = window.setTimeout(() => navigate({ to: "/partner" }), 4200);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(done);
    };
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center px-8">
      <div className="w-full max-w-[24rem] text-center">
        <p className="overline">Assigning identities</p>
        <p
          key={index}
          className="mt-6 animate-veil font-display text-3xl leading-tight text-balance"
          aria-live="polite"
        >
          {LOADING_LINES[index]}
        </p>
        <div className="mx-auto mt-10 h-px w-40 overflow-hidden bg-border">
          <span
            aria-hidden
            className="block h-px w-1/2 animate-shimmer bg-[linear-gradient(90deg,transparent,var(--ember),transparent)] bg-[length:200%_100%]"
          />
        </div>
      </div>
    </main>
  );
}
