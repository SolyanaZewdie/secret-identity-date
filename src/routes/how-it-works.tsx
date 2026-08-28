import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, StepHeader } from "@/components/lela/shell";
import { VeiledCard } from "@/components/lela/veiled-card";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How LELA works — secret characters for a real date" },
      {
        name: "description",
        content:
          "Three steps: get your secret character, keep it hidden, then meet in person and discover who your partner became.",
      },
      { property: "og:title", content: "How LELA works" },
      {
        property: "og:description",
        content:
          "Get a secret character, keep it hidden, meet in person. The date stays real — the characters make it different.",
      },
    ],
  }),
  component: HowItWorks,
});

const BEATS = [
  {
    n: "01",
    title: "Get Your Character",
    body: "LELA gives you a secret character. Your partner gets a different one. They are chosen independently, so they might not go together at all. That's the point.",
  },
  {
    n: "02",
    title: "Keep It Secret",
    body: "Dress the part. Talk the part. Don't show them your screen. Pass the phone over so they can read theirs in private.",
  },
  {
    n: "03",
    title: "Meet IRL",
    body: "Go on your actual date — dinner, coffee, a walk, whatever you already planned. Stay in character. Put the phone away.",
  },
  {
    n: "04",
    title: "Reveal Yourselves",
    body: "At the end of the night, LELA reveals both characters. This is usually where the laughing happens.",
  },
];

function HowItWorks() {
  return (
    <Phone>
      <StepHeader
        title="How it works"
        copy="LELA isn't a game you play on your phone. It's a small secret you carry into a real evening."
        back={{ to: "/", label: "Back" }}
      />

      <div className="my-10 flex items-center justify-center gap-5 px-6">
        <VeiledCard label="Yours" tilt="left" className="max-w-[8.5rem]" />
        <VeiledCard label="Theirs" tilt="right" className="max-w-[8.5rem]" />
      </div>

      <ol className="space-y-3">
        {BEATS.map((b) => (
          <li key={b.n} className="card-night rounded-2xl p-5">
            <span className="font-mono text-xs tracking-[0.3em] text-ember">{b.n}</span>
            <h2 className="mt-3 font-display text-2xl leading-tight">{b.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-12 rounded-2xl border border-border p-5">
        <h2 className="overline">What LELA isn't</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Not a dating app. Not matchmaking. Not therapy. Not a board game, and definitely
          not a night spent staring at screens. Just an unexpected layer of personality on
          a date you were already going to have.
        </p>
      </section>

      <Link
        to="/create"
        className="mt-10 block rounded-full bg-ember px-6 py-4 text-center text-xs font-semibold tracking-[0.16em] uppercase text-ember-foreground"
      >
        Create a Date
      </Link>
    </Phone>
  );
}
