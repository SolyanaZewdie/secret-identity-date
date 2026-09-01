import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GhostButton, Phone, PrimaryButton, Wordmark } from "@/components/lela/shell";
import { VeiledCard } from "@/components/lela/veiled-card";
import { FormError } from "@/components/lela/pairing";
import {
  createGuest,
  currentUser,
  joinCouple,
  lookupInvite,
  type InviteLookup,
} from "@/lib/lela/account";

export const Route = createFileRoute("/join/$code")({
  head: () => ({
    meta: [
      { title: "You've been invited to LELA." },
      {
        name: "description",
        content: "Someone wants you to join their date. You'll each get a secret character.",
      },
      { property: "og:title", content: "You've been invited to LELA." },
      { property: "og:description", content: "Someone wants you to join their date." },
    ],
  }),
  component: JoinInvite,
});

function JoinInvite() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [lookup, setLookup] = useState<InviteLookup | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setLookup(lookupInvite(code));
  }, [code]);

  if (!lookup) return <Phone> </Phone>;

  if (lookup.state === "invalid" || lookup.state === "expired") {
    const expired = lookup.state === "expired";
    return (
      <Phone>
        <Wordmark className="text-lg" />
        <h1 className="display-lg mt-12">
          {expired ? "This invitation has expired." : "That invite doesn't seem to work."}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {expired
            ? "Ask your partner to make you a new one."
            : "Check the code, or ask them to send it again."}
        </p>
        <div className="mt-9 space-y-2.5">
          <PrimaryButton onClick={() => navigate({ to: "/join" })}>Try Again</PrimaryButton>
          <GhostButton onClick={() => navigate({ to: "/" })}>Not Now</GhostButton>
        </div>
      </Phone>
    );
  }

  if (lookup.state === "full") {
    return (
      <Phone>
        <Wordmark className="text-lg" />
        <h1 className="display-lg mt-12">That couple is complete.</h1>
        <p className="mt-3 text-sm text-muted-foreground">LELA is only ever two people.</p>
        <div className="mt-9">
          <GhostButton onClick={() => navigate({ to: "/" })}>Go Back</GhostButton>
        </div>
      </Phone>
    );
  }

  const join = () => {
    if (!currentUser()) createGuest();
    const result = joinCouple(code);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate({ to: "/connected" });
  };

  const hostName = lookup.state === "open" ? lookup.host?.name : null;

  return (
    <Phone>
      <div className="text-center">
        <Wordmark className="text-lg" />
        <p className="overline mt-12">Invitation</p>
        <h1 className="display-lg mt-4 text-balance">You've been invited to LELA.</h1>
        <p className="mt-4 text-[0.98rem] leading-relaxed text-muted-foreground">
          {hostName ? `${hostName} wants you to join their date.` : "Someone wants you to join their date."}
        </p>

        <div className="mt-11 flex items-center justify-center gap-5 px-8">
          <VeiledCard label="Them" tilt="left" className="max-w-[8.5rem]" />
          <VeiledCard label="You" tilt="right" className="max-w-[8.5rem]" />
        </div>

        <p className="mt-10 text-sm leading-relaxed text-foreground/85">
          You'll each get a secret character before you meet. Neither of you knows the other's.
        </p>

        <div className="mt-9 space-y-2.5">
          <FormError>{error}</FormError>
          <PrimaryButton onClick={join}>Join Them</PrimaryButton>
          <GhostButton onClick={() => navigate({ to: "/" })}>Not Now</GhostButton>
        </div>
        <p className="mt-5 text-xs text-muted-foreground">
          No account needed. Code {lookup.couple.code}.
        </p>
      </div>
    </Phone>
  );
}
