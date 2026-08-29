import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CharacterCard } from "@/components/lela/character-card";
import {
  GhostButton,
  Phone,
  PrimaryButton,
  SecretNotice,
  StickyBar,
  Wordmark,
} from "@/components/lela/shell";
import { CHARACTERS_BY_ID } from "@/lib/lela/characters";
import { getViewer, loadCurrent, saveCurrent, type Partner } from "@/lib/lela/session";
import { INTENSITIES, labelOf } from "@/lib/lela/data";

export const Route = createFileRoute("/reveal/$partner")({
  head: () => ({
    meta: [
      { title: "Your secret identity — LELA" },
      {
        name: "description",
        content: "Your character for tonight. Don't show them. Keep this secret until you meet.",
      },
      { property: "og:title", content: "Your secret identity — LELA" },
      { property: "og:description", content: "Your identity has been assigned. Don't let them see this." },
    ],
  }),
  component: Reveal,
});

type State = "loading" | "sealed" | "open" | "locked" | "missing";

function Reveal() {
  const { partner } = Route.useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<State>("loading");
  const [session, setSession] = useState(() => loadCurrent());

  useEffect(() => {
    const current = loadCurrent();
    setSession(current);
    if (!current || (partner !== "A" && partner !== "B")) {
      setState("missing");
      return;
    }
    const assignment = current[partner as Partner];
    const viewer = getViewer();
    if (!assignment.seen || viewer === partner || current.ended) setState("sealed");
    else setState("locked");
  }, [partner]);

  if (state === "loading") return <Phone> </Phone>;

  if (state === "missing") {
    return (
      <Phone>
        <Wordmark className="text-lg" />
        <h1 className="display-lg mt-10">Nothing assigned yet.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Create a date and LELA will hand you both an identity.
        </p>
        <Link
          to="/create"
          className="mt-8 block rounded-full bg-ember px-6 py-4 text-center text-xs font-semibold tracking-[0.16em] uppercase text-ember-foreground"
        >
          Create a Date
        </Link>
      </Phone>
    );
  }

  if (state === "locked") {
    return (
      <Phone>
        <div className="pt-24 text-center">
          <p className="text-5xl" aria-hidden>
            🔒
          </p>
          <h1 className="display-lg mt-6">Nice try.</h1>
          <p className="mt-3 text-sm text-muted-foreground">That's their secret.</p>
          <div className="mt-9 space-y-2.5">
            <GhostButton onClick={() => navigate({ to: "/date" })}>Go Back</GhostButton>
          </div>
        </div>
      </Phone>
    );
  }

  const p = partner as Partner;
  const assignment = session![p];
  const character = CHARACTERS_BY_ID[assignment.characterId]!;
  const opened = state === "open";

  const open = () => {
    const current = loadCurrent();
    if (current) {
      saveCurrent({ ...current, [p]: { ...current[p], seen: true } });
      setSession({ ...current, [p]: { ...current[p], seen: true } });
    }
    setState("open");
  };

  if (!opened) {
    return (
      <Phone>
        <div className="pt-16 text-center">
          <p className="overline">Partner {p}</p>
          <h1 className="display-lg mt-6 text-balance">Your identity has been assigned.</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Tonight, you're someone else. Your partner has no idea who.
          </p>
          <div className="mt-8">
            <SecretNotice>
              Before you open this — check that nobody is reading over your shoulder.
            </SecretNotice>
          </div>
          <div className="mt-8">
            <PrimaryButton onClick={open}>Open My Envelope</PrimaryButton>
          </div>
        </div>
      </Phone>
    );
  }

  return (
    <Phone>
      <header className="mb-5">
        <p className="overline text-ember">🔒 Your secret identity</p>
        <h1 className="display-lg mt-3">Don't show them.</h1>
      </header>

      <CharacterCard character={character} />

      <p className="mt-5 text-xs text-muted-foreground">
        Intensity: {labelOf(INTENSITIES, session!.intensity)} · Partner {p}
      </p>

      {session!.scenario ? (
        <section className="mt-6 rounded-2xl border border-orchid/40 bg-orchid/10 p-5">
          <h2 className="overline">Scenario · {session!.scenario.title}</h2>
          <p className="mt-2.5 text-sm leading-relaxed text-foreground/90">
            {session!.scenario.body}
          </p>
        </section>
      ) : (
        <section className="mt-6 rounded-2xl border border-border p-5">
          <h2 className="overline">No scenario tonight</h2>
          <p className="mt-2.5 font-display text-xl leading-snug">
            Tonight, you're simply being someone else.
          </p>
        </section>
      )}

      {assignment.missions.length > 0 ? (
        <section className="mt-6 space-y-2.5">
          {assignment.missions.map((m) => (
            <div key={m} className="card-night rounded-2xl p-5">
              <h2 className="overline text-ember">Secret mission</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{m}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Optional. Nobody's counting. Nobody wins.
          </p>
        </section>
      ) : null}

      <div className="mt-8">
        <SecretNotice>Keep this secret until you meet.</SecretNotice>
      </div>

      <StickyBar>
        <PrimaryButton onClick={() => navigate({ to: "/begin/$partner", params: { partner: p } })}>
          I'm Ready
        </PrimaryButton>
      </StickyBar>
    </Phone>
  );
}
