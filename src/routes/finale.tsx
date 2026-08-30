import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CharacterCard } from "@/components/lela/character-card";
import { Phone, PrimaryButton, Wordmark } from "@/components/lela/shell";
import { VeiledCard } from "@/components/lela/veiled-card";
import { CHARACTERS_BY_ID } from "@/lib/lela/characters";
import { getViewer, loadCurrent, type DateSession, type Partner } from "@/lib/lela/session";

export const Route = createFileRoute("/finale")({
  head: () => ({
    meta: [
      { title: "Reveal yourselves — LELA" },
      { name: "description", content: "Time to find out who you've been sitting across from." },
      { property: "og:title", content: "Reveal yourselves — LELA" },
      { property: "og:description", content: "Okay… reveal yourselves. This is the good part." },
    ],
  }),
  component: Finale,
});

type Stage = "intro" | "mine" | "theirs";

function Finale() {
  const navigate = useNavigate();
  const [session, setSession] = useState<DateSession | null>(null);
  const [me, setMe] = useState<Partner>("A");
  const [stage, setStage] = useState<Stage>("intro");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(loadCurrent());
    setMe(getViewer() ?? "A");
    setReady(true);
  }, []);

  if (!ready) return <Phone> </Phone>;

  if (!session) {
    return (
      <Phone>
        <Wordmark className="text-lg" />
        <h1 className="display-lg mt-10">Nothing to reveal.</h1>
        <Link
          to="/create"
          className="mt-8 block rounded-full bg-ember px-6 py-4 text-center text-xs font-semibold tracking-[0.16em] uppercase text-ember-foreground"
        >
          Create a Date
        </Link>
      </Phone>
    );
  }

  const other: Partner = me === "A" ? "B" : "A";
  const mine = CHARACTERS_BY_ID[session[me].characterId]!;
  const theirs = CHARACTERS_BY_ID[session[other].characterId]!;

  if (stage === "intro") {
    return (
      <Phone>
        <div className="pt-16 text-center">
          <h1 className="display-xl">Okay…</h1>
          <p className="mt-5 text-[0.98rem] leading-relaxed text-muted-foreground">
            Time to find out who you've been sitting across from.
          </p>
          <div className="mt-12 flex items-center justify-center gap-5 px-6">
            <VeiledCard label={`Partner ${me}`} tilt="left" className="max-w-[8.5rem]" />
            <VeiledCard label={`Partner ${other}`} tilt="right" className="max-w-[8.5rem]" />
          </div>
          <div className="mt-12">
            <PrimaryButton onClick={() => setStage("mine")}>Reveal My Character</PrimaryButton>
          </div>
        </div>
      </Phone>
    );
  }

  if (stage === "mine") {
    return (
      <Phone>
        <p className="overline">Partner {me}</p>
        <h1 className="display-lg mt-3">You were…</h1>
        <div className="mt-6">
          <CharacterCard character={mine} compact />
        </div>
        <p className="mt-7 font-display text-2xl leading-snug text-foreground/80">
          Now reveal theirs.
        </p>
        <div className="mt-5">
          <PrimaryButton onClick={() => setStage("theirs")}>
            Reveal Their Character
          </PrimaryButton>
        </div>
      </Phone>
    );
  }

  return (
    <Phone>
      <p className="overline">Partner {other}</p>
      <h1 className="display-lg mt-3">They were…</h1>
      <div className="mt-6">
        <CharacterCard character={theirs} compact />
      </div>
      <p className="mt-8 text-center font-display text-3xl leading-tight text-balance">
        <span aria-hidden>{mine.emoji}</span> + <span aria-hidden>{theirs.emoji}</span>
        <br />
        <span className="ember-text">You had no idea.</span>
      </p>
      <div className="mt-9">
        <PrimaryButton onClick={() => navigate({ to: "/recap" })}>
          See Tonight's Recap
        </PrimaryButton>
      </div>
    </Phone>
  );
}
