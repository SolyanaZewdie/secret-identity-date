import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Phone, StepHeader } from "@/components/lela/shell";
import { SecretNotice } from "@/components/lela/shell";
import { createGuest, createInvite } from "@/lib/lela/account";
import { useAccount } from "@/lib/lela/useAccount";

export const Route = createFileRoute("/guest")({
  head: () => ({
    meta: [
      { title: "Let's get you connected — LELA" },
      {
        name: "description",
        content: "Pair with your partner as a guest — scan their QR code or enter their couple code.",
      },
      { property: "og:title", content: "Let's get you connected — LELA" },
      { property: "og:description", content: "Scan their QR code, or enter their six-digit code." },
    ],
  }),
  component: GuestPairing,
});

function Option({
  emoji,
  title,
  copy,
  onClick,
}: {
  emoji: string;
  title: string;
  copy: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card-night flex w-full items-start gap-4 rounded-2xl px-5 py-6 text-left transition-all hover:-translate-y-0.5 hover:border-ember/50"
    >
      <span aria-hidden className="text-2xl leading-none">{emoji}</span>
      <span className="flex-1">
        <span className="block font-display text-2xl leading-tight">{title}</span>
        <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">{copy}</span>
      </span>
      <span aria-hidden className="mt-1 text-ember">→</span>
    </button>
  );
}

function GuestPairing() {
  const navigate = useNavigate();
  const { ready, user, connected } = useAccount();

  useEffect(() => {
    if (!ready) return;
    if (!user) createGuest();
    else if (connected) navigate({ to: "/home", replace: true });
  }, [ready, user, connected, navigate]);

  return (
    <Phone>
      <StepHeader
        title="Let's get you connected."
        copy="No account, no problem. You just need your person."
        back={{ to: "/welcome", label: "Back" }}
      />

      <div className="space-y-3">
        <Option
          emoji="📱"
          title="Scan a QR Code"
          copy="Your partner should show you theirs — open your camera and point it at it."
          onClick={() => navigate({ to: "/join" })}
        />
        <Option
          emoji="🔢"
          title="Enter a Code"
          copy="Ask your partner for their 6-digit code."
          onClick={() => navigate({ to: "/join" })}
        />
        <Option
          emoji="💌"
          title="Invite Them Instead"
          copy="Show them your own code and let them join you."
          onClick={() => {
            createInvite();
            navigate({ to: "/invite" });
          }}
        />
      </div>

      <div className="mt-8">
        <SecretNotice>
          Guest dates are temporary. You can create an account later to keep your memories.
        </SecretNotice>
      </div>
    </Phone>
  );
}
