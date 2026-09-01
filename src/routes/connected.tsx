import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Phone, PrimaryButton, Wordmark } from "@/components/lela/shell";
import { useAccount } from "@/lib/lela/useAccount";

export const Route = createFileRoute("/connected")({
  head: () => ({
    meta: [
      { title: "You're connected — LELA" },
      { name: "description", content: "You're both on LELA. Time to become other people." },
      { property: "og:title", content: "You're connected — LELA" },
      { property: "og:description", content: "You're both ready for LELA." },
    ],
  }),
  component: Connected,
});

function Connected() {
  const navigate = useNavigate();
  const { ready, connected } = useAccount();

  useEffect(() => {
    if (ready && !connected) navigate({ to: "/couple", replace: true });
  }, [ready, connected, navigate]);

  return (
    <Phone>
      <div className="text-center">
        <Wordmark className="text-lg" />
        <p className="mt-24 text-5xl" aria-hidden>❤️</p>
        <h1 className="display-xl mt-6">You're connected.</h1>
        <p className="mt-4 text-[0.98rem] leading-relaxed text-muted-foreground">
          You're both ready for LELA.
        </p>
        <div className="mt-14">
          <PrimaryButton onClick={() => navigate({ to: "/home" })}>Start</PrimaryButton>
        </div>
      </div>
    </Phone>
  );
}
