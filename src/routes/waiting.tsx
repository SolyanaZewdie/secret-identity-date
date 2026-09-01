import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { GhostButton, Phone, PrimaryButton, SecretNotice, Wordmark } from "@/components/lela/shell";
import { StatusRow } from "@/components/lela/pairing";
import { VeiledCard } from "@/components/lela/veiled-card";
import { loadCurrent, saveCurrent } from "@/lib/lela/session";
import { useAccount } from "@/lib/lela/useAccount";
import { useCurrentSession } from "@/lib/lela/useSession";

export const Route = createFileRoute("/waiting")({
  head: () => ({
    meta: [
      { title: "Tonight is almost here — LELA" },
      {
        name: "description",
        content: "The waiting room before the secrets begin. Both of you join, then each reveal.",
      },
      { property: "og:title", content: "Tonight is almost here — LELA" },
      { property: "og:description", content: "Once you're both here, the secrets begin." },
    ],
  }),
  component: WaitingRoom,
});

function WaitingRoom() {
  const navigate = useNavigate();
  const { ready, slot, couple } = useAccount();
  const { session, ready: sessionReady } = useCurrentSession();

  useEffect(() => {
    if (ready && !slot) navigate({ to: "/welcome", replace: true });
  }, [ready, slot, navigate]);

  if (!ready || !sessionReady || !slot) return <Phone> </Phone>;

  if (!session || (couple && session.coupleId && session.coupleId !== couple.id)) {
    return (
      <Phone>
        <Wordmark className="text-lg" />
        <h1 className="display-lg mt-12">No date waiting.</h1>
        <div className="mt-8">
          <PrimaryButton onClick={() => navigate({ to: "/create" })}>Create a Date</PrimaryButton>
        </div>
      </Phone>
    );
  }

  const other = slot === "A" ? "B" : "A";
  const iJoined = session.joined[slot];
  const theyJoined = session.joined[other];

  const join = () => {
    const current = loadCurrent();
    if (!current) return;
    saveCurrent({ ...current, joined: { ...current.joined, [slot]: true } });
  };

  const both = iJoined && theyJoined;

  return (
    <Phone>
      <header className="mb-9 flex items-center justify-between">
        <Wordmark className="text-lg" />
        <span className="overline">Waiting room</span>
      </header>

      <h1 className="display-lg text-balance">
        {both ? "You're both here." : "Tonight is almost here."}
      </h1>
      <p className="mt-4 text-[0.98rem] leading-relaxed text-muted-foreground">
        {both
          ? "Now the secrets begin."
          : "Nothing starts until you're both in. Nothing is revealed until you are."}
      </p>

      <div className="mt-9 flex items-center justify-center gap-5 px-8">
        <VeiledCard label="You" tilt="left" className="max-w-[8.5rem]" />
        <VeiledCard label="Them" tilt="right" className="max-w-[8.5rem]" />
      </div>

      <div className="mt-10 space-y-2.5">
        <StatusRow
          state={iJoined ? "ready" : "waiting"}
          label={iJoined ? "You're ready." : "You haven't joined yet."}
        />
        <StatusRow
          state={theyJoined ? "ready" : "waiting"}
          label={theyJoined ? "Your partner is here." : "Your partner hasn't joined yet."}
          note={theyJoined ? undefined : "You'll see nothing about them until the reveal."}
        />
      </div>

      <div className="mt-9 space-y-2.5">
        {!iJoined ? (
          <PrimaryButton onClick={join}>I'm In</PrimaryButton>
        ) : both ? (
          <PrimaryButton
            onClick={() => navigate({ to: "/reveal/$partner", params: { partner: slot } })}
          >
            Reveal My Character
          </PrimaryButton>
        ) : (
          <GhostButton onClick={() => navigate({ to: "/home" })}>Back Home</GhostButton>
        )}
      </div>

      <div className="mt-7">
        <SecretNotice>
          Your character is only ever shown on your device. Theirs is only ever shown on theirs.
        </SecretNotice>
      </div>
    </Phone>
  );
}
