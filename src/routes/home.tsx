import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppNav } from "@/components/lela/nav";
import { Phone, PrimaryButton, GhostButton } from "@/components/lela/shell";
import { StatusRow } from "@/components/lela/pairing";
import { DATE_STYLES, VIBES, labelOf } from "@/lib/lela/data";
import { loadCurrent, saveCurrent } from "@/lib/lela/session";
import { useAccount } from "@/lib/lela/useAccount";
import { useCurrentSession } from "@/lib/lela/useSession";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "You + Your Person — LELA" },
      {
        name: "description",
        content: "Your couple home on LELA. Start a date and each of you gets a secret character.",
      },
      { property: "og:title", content: "You + Your Person — LELA" },
      { property: "og:description", content: "Your next date is waiting." },
    ],
  }),
  component: CoupleHome,
});

function CoupleHome() {
  const navigate = useNavigate();
  const { ready, user, couple, connected, slot, isGuest } = useAccount();
  const { session, ready: sessionReady } = useCurrentSession();

  useEffect(() => {
    if (!ready) return;
    if (!user) navigate({ to: "/welcome", replace: true });
    else if (!connected) navigate({ to: "/couple", replace: true });
  }, [ready, user, connected, navigate]);

  if (!ready || !sessionReady || !slot || !couple) {
    return (
      <Phone>
        <AppNav />
      </Phone>
    );
  }

  const ours = session && session.coupleId === couple.id ? session : null;
  const other = slot === "A" ? "B" : "A";
  const iJoined = ours?.joined[slot] ?? false;
  const theyJoined = ours?.joined[other] ?? false;

  const joinDate = () => {
    const current = loadCurrent();
    if (!current) return;
    saveCurrent({ ...current, joined: { ...current.joined, [slot]: true } });
    navigate({ to: "/waiting" });
  };

  return (
    <Phone>
      <AppNav />

      <h1 className="display-lg">You + Your Person</h1>
      <p className="mt-3 flex items-center gap-2 text-sm text-foreground/85">
        <span aria-hidden>💕</span> Connected
        {isGuest ? <span className="text-xs text-muted-foreground">· guest night</span> : null}
      </p>

      <section className="mt-10">
        <h2 className="overline">Next date</h2>

        {!ours ? (
          <div className="card-night mt-3 rounded-3xl px-6 py-10 text-center">
            <p className="text-3xl" aria-hidden>🕯️</p>
            <p className="mt-5 font-display text-3xl leading-tight">Your next date is waiting.</p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              One of you starts it. Then you each find out who you are — separately.
            </p>
            <div className="mt-8">
              <PrimaryButton onClick={() => navigate({ to: "/create" })}>Create a Date</PrimaryButton>
            </div>
          </div>
        ) : ours.ended ? (
          <div className="card-night mt-3 rounded-3xl p-6">
            <p className="font-display text-3xl leading-tight">The date is done.</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Finish the reveal and keep the memory.
            </p>
            <div className="mt-7 space-y-2.5">
              <PrimaryButton onClick={() => navigate({ to: "/finale" })}>Reveal Yourselves</PrimaryButton>
            </div>
          </div>
        ) : !iJoined ? (
          <div className="card-night mt-3 rounded-3xl p-6">
            <p className="text-3xl" aria-hidden>👀</p>
            <p className="mt-4 font-display text-3xl leading-tight">Your partner created a date.</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              A new LELA date is waiting. That's all you get to know for now.
            </p>
            <div className="mt-7">
              <PrimaryButton onClick={joinDate}>I'm In</PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="card-night mt-3 rounded-3xl p-6">
            <p className="overline text-ember">Tonight's date</p>
            <p className="mt-3 font-display text-3xl leading-tight">
              {labelOf(DATE_STYLES, ours.style)} · {labelOf(VIBES, ours.vibe)}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Your date is ready. Nothing about your partner is shown here — that would spoil it.
            </p>
            <div className="mt-6 space-y-2.5">
              <StatusRow state="ready" label="You're ready." />
              <StatusRow
                state={theyJoined ? "ready" : "waiting"}
                label={theyJoined ? "Your partner is here." : "Your partner hasn't joined yet."}
              />
            </div>
            <div className="mt-7 space-y-2.5">
              <PrimaryButton onClick={() => navigate({ to: "/waiting" })}>
                {theyJoined ? "Open Tonight" : "Waiting Room"}
              </PrimaryButton>
              <GhostButton onClick={() => navigate({ to: "/date" })}>Date Mode</GhostButton>
            </div>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="overline">Together</h2>
        <div className="mt-3 space-y-2.5">
          <Link
            to="/dates"
            className="card-night block rounded-2xl px-5 py-5 transition-colors hover:border-ember/50"
          >
            <span className="font-display text-2xl">Our Dates</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Every night you were someone else.
            </span>
          </Link>
          <Link
            to="/how-it-works"
            className="card-night block rounded-2xl px-5 py-5 transition-colors hover:border-ember/50"
          >
            <span className="font-display text-2xl">How LELA works</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              The short version: don't tell them.
            </span>
          </Link>
        </div>
      </section>
    </Phone>
  );
}
