import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Phone, StepHeader } from "@/components/lela/shell";
import { createGuest, isConnected } from "@/lib/lela/account";
import { useAccount } from "@/lib/lela/useAccount";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "How are you joining LELA?" },
      {
        name: "description",
        content:
          "Sign in, make an account, or just visit as a guest. Every way gets you a secret character tonight.",
      },
      { property: "og:title", content: "How are you joining LELA?" },
      {
        property: "og:description",
        content: "Sign in, make an account, or continue as a guest — the date works either way.",
      },
    ],
  }),
  component: Welcome,
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
      <span aria-hidden className="text-2xl leading-none">
        {emoji}
      </span>
      <span className="flex-1">
        <span className="block font-display text-2xl leading-tight">{title}</span>
        <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">{copy}</span>
      </span>
      <span aria-hidden className="mt-1 text-ember">
        →
      </span>
    </button>
  );
}

function Welcome() {
  const navigate = useNavigate();
  const { ready, user, couple } = useAccount();

  useEffect(() => {
    if (!ready) return;
    if (isConnected(couple)) navigate({ to: "/home", replace: true });
    else if (user) navigate({ to: "/couple", replace: true });
  }, [ready, user, couple, navigate]);

  return (
    <Phone>
      <StepHeader
        title="How are you joining LELA?"
        copy="However you arrive, you'll both get a secret character tonight."
        back={{ to: "/", label: "Back" }}
      />

      <div className="space-y-3">
        <Option
          emoji="💕"
          title="I have an account"
          copy="Sign in and find your person."
          onClick={() => navigate({ to: "/signin" })}
        />
        <Option
          emoji="✨"
          title="I'm new here"
          copy="Create an account and keep your dates."
          onClick={() => navigate({ to: "/signup" })}
        />
        <Option
          emoji="👀"
          title="Just visiting"
          copy="Continue as a guest. Nothing to sign, nothing to remember."
          onClick={() => {
            createGuest();
            navigate({ to: "/guest" });
          }}
        />
      </div>

      <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
        Guests get the whole experience — characters, missions, the reveal. You can keep the
        memories later if you want to.
      </p>
    </Phone>
  );
}
