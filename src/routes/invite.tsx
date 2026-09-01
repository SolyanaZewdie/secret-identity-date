import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GhostButton, Phone, PrimaryButton, StepHeader } from "@/components/lela/shell";
import { InviteCard, StatusRow } from "@/components/lela/pairing";
import { createInvite, refreshInvite } from "@/lib/lela/account";
import { useAccount } from "@/lib/lela/useAccount";

export const Route = createFileRoute("/invite")({
  head: () => ({
    meta: [
      { title: "Invite your partner — LELA" },
      {
        name: "description",
        content: "Send your person a LELA invitation. They don't need an account to join.",
      },
      { property: "og:title", content: "Invite your partner — LELA" },
      { property: "og:description", content: "Send them this. They don't need an account to join." },
    ],
  }),
  component: InvitePage,
});

function InvitePage() {
  const navigate = useNavigate();
  const { ready, user, couple, connected, expired } = useAccount();
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) navigate({ to: "/welcome", replace: true });
    else if (!couple) createInvite();
  }, [ready, user, couple, navigate]);

  if (!ready || !couple) return <Phone> </Phone>;

  if (expired) {
    return (
      <Phone>
        <StepHeader title="This invitation has expired." copy="Codes don't last forever. Here's a fresh one." />
        <PrimaryButton onClick={() => refreshInvite()}>Create a New Invite</PrimaryButton>
      </Phone>
    );
  }

  if (connected) {
    return (
      <Phone>
        <StepHeader title="Your partner is here." copy="You're connected. The secrets can start." />
        <StatusRow state="ready" label="You're both on LELA." note="One couple, two secrets." />
        <div className="mt-8">
          <PrimaryButton onClick={() => navigate({ to: "/connected" })}>Continue</PrimaryButton>
        </div>
      </Phone>
    );
  }

  return (
    <Phone>
      <StepHeader
        title="Invite your partner"
        copy="Send them this. They don't need an account to join."
        back={{ to: "/couple", label: "Back" }}
      />

      <InviteCard code={couple.code} />

      <div className="mt-6">
        {waiting ? (
          <StatusRow state="waiting" label="Waiting for your partner…" note="This page updates the moment they join." />
        ) : (
          <GhostButton onClick={() => setWaiting(true)}>I'm Waiting</GhostButton>
        )}
      </div>

      <p className="mt-7 text-xs leading-relaxed text-muted-foreground">
        Can't scan? They can open LELA and enter the code instead.
      </p>
    </Phone>
  );
}
