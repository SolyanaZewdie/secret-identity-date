import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GhostButton, Phone, PrimaryButton, Wordmark } from "@/components/lela/shell";
import { CHARACTERS_BY_ID } from "@/lib/lela/characters";
import { DATE_PROMPTS } from "@/lib/lela/data";
import {
  getViewer,
  loadCurrent,
  saveCurrent,
  setViewer,
  type DateSession,
  type Partner,
} from "@/lib/lela/session";

export const Route = createFileRoute("/date")({
  head: () => ({
    meta: [
      { title: "Date mode — LELA" },
      { name: "description", content: "Minimal date mode. Put your phone away and enjoy the date." },
      { property: "og:title", content: "Date mode — LELA" },
      { property: "og:description", content: "Stay in character. Put your phone away and enjoy the date." },
    ],
  }),
  component: DateMode,
});

function DateMode() {
  const navigate = useNavigate();
  const [session, setSession] = useState<DateSession | null>(null);
  const [viewer, setViewerState] = useState<Partner | null>(null);
  const [ready, setReady] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [promptDone, setPromptDone] = useState(false);
  const [showMissions, setShowMissions] = useState(false);

  useEffect(() => {
    const current = loadCurrent();
    setSession(current);
    setViewerState(getViewer());
    setPromptIndex(Math.floor(Math.random() * DATE_PROMPTS.length));
    setReady(true);
  }, []);

  if (!ready) return <Phone> </Phone>;

  if (!session) {
    return (
      <Phone>
        <Wordmark className="text-lg" />
        <h1 className="display-lg mt-10">No date running.</h1>
        <Link
          to="/create"
          className="mt-8 block rounded-full bg-ember px-6 py-4 text-center text-xs font-semibold tracking-[0.16em] uppercase text-ember-foreground"
        >
          Create a Date
        </Link>
      </Phone>
    );
  }

  if (!viewer) {
    return (
      <Phone>
        <Wordmark className="text-lg" />
        <h1 className="display-lg mt-10">Who's holding the phone?</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          So LELA shows the right character — and only that one.
        </p>
        <div className="mt-8 space-y-2.5">
          {(["A", "B"] as Partner[]).map((p) => (
            <GhostButton
              key={p}
              onClick={() => {
                setViewer(p);
                setViewerState(p);
              }}
            >
              I'm Partner {p}
            </GhostButton>
          ))}
        </div>
      </Phone>
    );
  }

  const assignment = session[viewer];
  const character = CHARACTERS_BY_ID[assignment.characterId]!;
  const prompt = DATE_PROMPTS[promptIndex % DATE_PROMPTS.length]!;

  const nextPrompt = (completed: boolean) => {
    if (completed) setPromptDone(true);
    setPromptIndex((i) => i + 1 + Math.floor(Math.random() * 2));
    window.setTimeout(() => setPromptDone(false), 1400);
  };

  const toggleMission = (mission: string) => {
    const current = loadCurrent();
    if (!current) return;
    const done = current.completedMissions.includes(mission)
      ? current.completedMissions.filter((m) => m !== mission)
      : [...current.completedMissions, mission];
    const next = { ...current, completedMissions: done };
    saveCurrent(next);
    setSession(next);
  };

  const endDate = () => {
    const current = loadCurrent();
    if (current) saveCurrent({ ...current, ended: true });
    navigate({ to: "/finale" });
  };

  return (
    <Phone>
      <header className="flex items-center justify-between">
        <p className="overline text-ember">🎭 Date mode</p>
        <button
          type="button"
          onClick={() => {
            setViewer(null);
            setViewerState(null);
          }}
          className="text-xs tracking-[0.14em] uppercase text-muted-foreground hover:text-foreground"
        >
          Not me
        </button>
      </header>

      <section className="mt-8">
        <p className="overline">Your character</p>
        <p className="mt-2 font-display text-4xl leading-none">
          <span aria-hidden className="mr-2">
            {character.emoji}
          </span>
          {character.name}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">{character.rule}</p>
      </section>

      <section className="card-night mt-8 rounded-2xl p-5">
        <h2 className="overline">Character prompt</h2>
        <p className="mt-3 font-display text-xl leading-snug" aria-live="polite">
          {promptDone ? "Nicely done. Back to the date." : prompt}
        </p>
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={() => nextPrompt(true)}
            className="flex-1 rounded-full bg-ember px-4 py-3 text-xs font-semibold tracking-[0.14em] uppercase text-ember-foreground"
          >
            Done
          </button>
          <button
            type="button"
            onClick={() => nextPrompt(false)}
            className="flex-1 rounded-full border border-border px-4 py-3 text-xs font-semibold tracking-[0.14em] uppercase"
          >
            Skip
          </button>
        </div>
      </section>

      {assignment.missions.length > 0 ? (
        <section className="mt-6">
          <button
            type="button"
            onClick={() => setShowMissions((s) => !s)}
            aria-expanded={showMissions}
            className="w-full rounded-2xl border border-border px-5 py-4 text-left text-sm"
          >
            <span className="overline text-ember">Secret missions</span>
            <span className="mt-1.5 block text-foreground/85">
              {showMissions ? "Hide them again" : `You have ${assignment.missions.length}. Peek?`}
            </span>
          </button>
          {showMissions ? (
            <ul className="mt-2.5 space-y-2.5">
              {assignment.missions.map((m) => {
                const done = session.completedMissions.includes(m);
                return (
                  <li key={m}>
                    <button
                      type="button"
                      onClick={() => toggleMission(m)}
                      aria-pressed={done}
                      className={`card-night w-full rounded-2xl px-5 py-4 text-left text-sm leading-relaxed ${
                        done ? "border-ember/60 text-foreground/60 line-through" : ""
                      }`}
                    >
                      {m}
                      <span className="mt-2 block text-[0.65rem] tracking-[0.18em] uppercase text-muted-foreground">
                        {done ? "Completed" : "Tap when it happens"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      ) : null}

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Put your phone away and enjoy the date. ❤️
      </p>

      <div className="mt-8">
        <PrimaryButton onClick={endDate}>End Date</PrimaryButton>
      </div>
    </Phone>
  );
}
