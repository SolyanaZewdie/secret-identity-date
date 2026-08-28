import { createFileRoute, Link } from "@tanstack/react-router";
import { VeiledCard } from "@/components/lela/veiled-card";
import { Wordmark } from "@/components/lela/shell";
import atmosphere from "@/assets/lela-atmosphere.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LELA — Be someone else tonight." },
      {
        name: "description",
        content:
          "LELA gives each of you a secret character before your real date. Dress the part, meet in person, and find out who they became.",
      },
      { property: "og:title", content: "LELA — Be someone else tonight." },
      {
        property: "og:description",
        content:
          "You'll each receive a secret character. Don't tell them. Meet in person. Find out who they became.",
      },
    ],
  }),
  component: Landing,
});

const STEPS = [
  {
    n: "01",
    title: "Get Your Character",
    body: "LELA gives you a secret character. Your partner gets a different one.",
  },
  {
    n: "02",
    title: "Keep It Secret",
    body: "Dress the part. Talk the part. Don't show them your screen.",
  },
  {
    n: "03",
    title: "Meet IRL",
    body: "Go on your actual date. Discover who they became when you meet.",
  },
];

const EXAMPLES = [
  { emoji: "🧪", name: "The Chemist" },
  { emoji: "✈️", name: "The Pilot" },
  { emoji: "🤠", name: "The Cowboy" },
  { emoji: "🕵️", name: "The Detective" },
  { emoji: "🎨", name: "The Artist" },
  { emoji: "🧛", name: "The Vampire" },
  { emoji: "📚", name: "The Victorian Librarian" },
  { emoji: "👽", name: "The Alien Tourist" },
];

function Cta({
  to,
  children,
  variant = "primary",
}: {
  to: string;
  children: string;
  variant?: "primary" | "ghost";
}) {
  return (
    <Link
      to={to}
      className={
        variant === "primary"
          ? "block rounded-full bg-ember px-6 py-4 text-center text-xs font-semibold tracking-[0.16em] uppercase text-ember-foreground transition-all hover:brightness-110"
          : "block rounded-full border border-border px-6 py-4 text-center text-xs font-semibold tracking-[0.16em] uppercase text-foreground/85 transition-colors hover:border-foreground/40"
      }
    >
      {children}
    </Link>
  );
}

function Landing() {
  return (
    <main className="mx-auto w-full max-w-[30rem] px-5 pb-20 sm:px-7">
      <nav className="flex items-center justify-between py-6">
        <Wordmark className="text-lg" />
        <Link
          to="/dates"
          className="text-xs tracking-[0.16em] uppercase text-muted-foreground hover:text-foreground"
        >
          Our dates
        </Link>
      </nav>

      <section className="relative animate-rise pt-4">
        <img
          src={atmosphere}
          alt=""
          aria-hidden
          width={1280}
          height={1600}
          className="pointer-events-none absolute -top-20 left-1/2 h-[26rem] w-[130%] -translate-x-1/2 object-cover opacity-45 mix-blend-screen [mask-image:radial-gradient(ellipse_at_50%_35%,black,transparent_72%)]"
        />
        <div className="relative">
          <p className="overline">ሌላ · another / other</p>
          <h1 className="display-xl mt-4">LELA</h1>
          <p className="mt-4 font-display text-3xl italic leading-tight text-foreground/95">
            Be someone else tonight.
          </p>
          <p className="mt-4 max-w-xs text-[0.98rem] leading-relaxed text-muted-foreground">
            Turn an ordinary date into something you'll remember.
          </p>
        </div>

        <div className="relative mt-12 flex items-center justify-center gap-5 px-4">
          <VeiledCard label="Partner A" tilt="left" className="max-w-[9.5rem]" />
          <VeiledCard label="Partner B" tilt="right" className="max-w-[9.5rem]" />
        </div>

        <p className="mt-10 border-l border-ember/60 pl-4 text-[0.95rem] leading-relaxed text-foreground/90">
          You'll each receive a secret character. Don't tell them. Meet in person. Find
          out who they became.
        </p>

        <div className="mt-8 space-y-2.5">
          <Cta to="/create">Create a Date</Cta>
          <Cta to="/how-it-works" variant="ghost">
            How It Works
          </Cta>
        </div>
      </section>

      <section className="mt-24">
        <h2 className="display-lg">How it works</h2>
        <ol className="mt-7 space-y-3">
          {STEPS.map((s) => (
            <li key={s.n} className="card-night rounded-2xl p-5">
              <span className="font-mono text-xs tracking-[0.3em] text-ember">{s.n}</span>
              <h3 className="mt-3 font-display text-2xl leading-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-24">
        <h2 className="display-lg">It could be anyone.</h2>
        <ul className="mt-7 grid grid-cols-2 gap-2.5">
          {EXAMPLES.map((c) => (
            <li
              key={c.name}
              className="card-night flex flex-col gap-2 rounded-xl px-4 py-4 text-sm"
            >
              <span aria-hidden className="text-xl">
                {c.emoji}
              </span>
              <span className="text-foreground/90">{c.name}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-muted-foreground">
          …and 40+ others waiting in the archive.
        </p>
      </section>

      <section className="mt-24 text-center">
        <p className="font-display text-4xl leading-tight">
          The date stays real.
          <br />
          <span className="ember-text">The characters make it different.</span>
        </p>
        <div className="mt-9">
          <Cta to="/create">Create Your First Date</Cta>
        </div>
      </section>

      <footer className="mt-20 border-t border-border pt-6 text-xs text-muted-foreground">
        LELA · a prototype for people who'd rather not have the same date twice.
      </footer>
    </main>
  );
}
