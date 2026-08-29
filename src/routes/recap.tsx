import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GhostButton, Phone, PrimaryButton, Wordmark } from "@/components/lela/shell";
import { CHARACTERS_BY_ID } from "@/lib/lela/characters";
import {
  DATE_STYLES,
  INTENSITIES,
  REPEAT_ANSWERS,
  VIBES,
  labelOf,
  type RepeatAnswer,
} from "@/lib/lela/data";
import {
  clearCurrent,
  loadCurrent,
  saveCurrent,
  saveToHistory,
  setViewer,
  type DateSession,
} from "@/lib/lela/session";

export const Route = createFileRoute("/recap")({
  head: () => ({
    meta: [
      { title: "Tonight's date — LELA" },
      { name: "description", content: "Both characters, the night's details, and whether you'd do it again." },
      { property: "og:title", content: "Tonight's date — LELA" },
      { property: "og:description", content: "Look at the two ridiculous people you were tonight." },
    ],
  }),
  component: Recap,
});

function Recap() {
  const navigate = useNavigate();
  const [session, setSession] = useState<DateSession | null>(null);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    const current = loadCurrent();
    setSession(current);
    setNote(current?.note ?? "");
    setReady(true);
  }, []);

  if (!ready) return <Phone> </Phone>;

  if (!session) {
    return (
      <Phone>
        <Wordmark className="text-lg" />
        <h1 className="display-lg mt-10">No night to recap yet.</h1>
        <Link
          to="/create"
          className="mt-8 block rounded-full bg-ember px-6 py-4 text-center text-xs font-semibold tracking-[0.16em] uppercase text-ember-foreground"
        >
          Create a Date
        </Link>
      </Phone>
    );
  }

  const a = CHARACTERS_BY_ID[session.A.characterId]!;
  const b = CHARACTERS_BY_ID[session.B.characterId]!;
  const totalMissions = session.A.missions.length + session.B.missions.length;

  const patch = (next: Partial<DateSession>) => {
    const merged = { ...session, ...next };
    setSession(merged);
    saveCurrent(merged);
  };

  const save = () => {
    saveToHistory({ ...session, note });
    clearCurrent();
    setViewer(null);
    navigate({ to: "/dates" });
  };

  const again = () => {
    clearCurrent();
    setViewer(null);
    navigate({ to: "/create" });
  };

  return (
    <Phone>
      <header className="mb-8 flex items-center justify-between">
        <Wordmark className="text-lg" />
        <span className="overline">Recap</span>
      </header>

      <h1 className="display-lg">Tonight's Date</h1>

      <div className="mt-7 space-y-2.5">
        {[
          { partner: "A", c: a },
          { partner: "B", c: b },
        ].map(({ partner, c }) => (
          <div key={partner} className="card-night flex items-center gap-4 rounded-2xl p-5">
            <span aria-hidden className="text-3xl">
              {c.emoji}
            </span>
            <span>
              <span className="overline">Partner {partner}</span>
              <span className="mt-1 block font-display text-xl leading-tight">{c.name}</span>
            </span>
          </div>
        ))}
      </div>

      <dl className="mt-7 grid grid-cols-2 gap-2.5 text-sm">
        <Fact label="Date type" value={labelOf(DATE_STYLES, session.style)} />
        <Fact label="Vibe" value={labelOf(VIBES, session.vibe)} />
        <Fact label="Intensity" value={labelOf(INTENSITIES, session.intensity)} />
        <Fact
          label="Missions"
          value={
            totalMissions === 0
              ? "None tonight"
              : `${session.completedMissions.length} of ${totalMissions} completed`
          }
        />
      </dl>

      <section className="mt-10">
        <h2 className="display-lg text-[1.8rem]">How was it?</h2>
        <div className="mt-4 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => patch({ rating: n })}
              aria-pressed={session.rating === n}
              aria-label={`Rate ${n} out of 5`}
              className={`flex-1 rounded-xl border py-4 font-display text-xl transition-colors ${
                (session.rating ?? 0) >= n
                  ? "border-ember bg-ember/15 text-foreground"
                  : "border-border text-muted-foreground"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-9">
        <h2 className="display-lg text-[1.8rem]">Would you do this again?</h2>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {REPEAT_ANSWERS.map((answer: RepeatAnswer) => (
            <button
              key={answer}
              type="button"
              onClick={() => patch({ again: answer })}
              aria-pressed={session.again === answer}
              className={`rounded-xl border px-4 py-3.5 text-sm transition-colors ${
                session.again === answer
                  ? "border-ember bg-ember/15"
                  : "border-border text-muted-foreground"
              }`}
            >
              {answer}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-9">
        <label htmlFor="note" className="overline">
          A line to remember it by (optional)
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="He called the bread a specimen for two hours."
          className="mt-3 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/70"
        />
      </section>

      <div className="mt-9 space-y-2.5 pb-4">
        <PrimaryButton onClick={save}>Save This Date</PrimaryButton>
        <GhostButton onClick={again}>Give Us Another</GhostButton>
      </div>
    </Phone>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border px-4 py-3">
      <dt className="overline">{label}</dt>
      <dd className="mt-1.5 text-foreground/90">{value}</dd>
    </div>
  );
}
