import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Phone, StepHeader } from "@/components/lela/shell";
import { createInvite } from "@/lib/lela/account";
import { useAccount } from "@/lib/lela/useAccount";

export const Route = createFileRoute("/couple")({
  head: () => ({
    meta: [
      { title: "Let's find your person — LELA" },
      {
        name: "description",
        content: "Invite your partner to LELA or join theirs. One couple, two secrets.",
      },
      { property: "og:title", content: "Let's find your person — LELA" },
      { property: "og:description", content: "Invite your person, or join theirs." },
    ],
  }),
  component: CoupleConnect,
});

function Choice({
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

function CoupleConnect() {
  const navigate = useNavigate();
  const { ready, user, connected } = useAccount();

  useEffect(() => {
    if (!ready) return;
    if (!user) navigate({ to: "/welcome", replace: true });
    else if (connected) navigate({ to: "/home", replace: true });
  }, [ready, user, connected, navigate]);

  return (
    <Phone>
      <StepHeader
        step={user?.kind === "member" ? "Welcome to LELA" : undefined}
        title="Let's find your person."
        copy="LELA only works with two. Send them an invitation, or join the one they sent you."
      />

      <div className="space-y-3">
        <Choice
          emoji="💌"
          title="Invite My Partner"
          copy="We'll make you a code and a QR to send them."
          onClick={() => {
            createInvite();
            navigate({ to: "/invite" });
          }}
        />
        <Choice
          emoji="🔗"
          title="Join My Partner"
          copy="Enter their code, or scan the QR they're holding."
          onClick={() => navigate({ to: "/join" })}
        />
      </div>

      <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
        They don't need an account to join you.
      </p>
    </Phone>
  );
}
