import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, Wordmark } from "@/components/lela/shell";
import { CHARACTERS_BY_ID } from "@/lib/lela/characters";
import { DATE_STYLES, labelOf } from "@/lib/lela/data";
import { useSavedDates } from "@/lib/lela/useSession";

export const Route = createFileRoute("/dates")({
  head: () => ({
    meta: [
      { title: "Our dates — LELA" },
      {
        name: "description",
        content: "A private scrapbook of every ridiculous person you've been together.",
      },
      { property: "og:title", content: "Our dates — LELA" },
      {
        property: "og:description",
        content: "Look at all the ridiculous people you've been.",
      },
    ],
  }),
  component: OurDates,
});

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

function OurDates() {
  const { dates, ready } = useSavedDates();

  return (
    <Phone>
      <header className="mb-8 flex items-center justify-between">
        <Wordmark className="text-lg" />
        <Link
          to="/create"
          className="text-xs tracking-[0.16em] uppercase text-muted-foreground hover:text-foreground"
        >
          New date
        </Link>
      </header>

      <h1 className="display-lg">Our Dates</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Every night you were someone else.
      </p>

      {!ready ? null : dates.length === 0 ? (
        <section className="mt-14 rounded-3xl border border-dashed border-border px-6 py-14 text-center">
          <p className="text-4xl" aria-hidden>
            🕯️
          </p>
          <h2 className="display-lg mt-5 text-[1.9rem]">No dates yet.</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Your first ridiculous night is waiting.
          </p>
          <Link
            to="/create"
            className="mt-8 inline-flex rounded-full bg-ember px-6 py-3.5 text-xs font-semibold tracking-[0.16em] uppercase text-ember-foreground"
          >
            Create a Date
          </Link>
        </section>
      ) : (
        <ul className="mt-8 space-y-3.5">
          {dates.map((d) => {
            const a = CHARACTERS_BY_ID[d.A.characterId]!;
            const b = CHARACTERS_BY_ID[d.B.characterId]!;
            const short = (name: string) => name.replace(/^The\s/, "The ");
            return (
              <li key={d.id} className="card-night overflow-hidden rounded-3xl">
                <div
                  aria-hidden
                  className="flex h-28 items-center justify-center gap-4 border-b border-border bg-[radial-gradient(circle_at_30%_20%,var(--veil),transparent_70%)] text-3xl"
                >
                  <span>{a.emoji}</span>
                  <span className="text-lg text-muted-foreground">+</span>
                  <span>{b.emoji}</span>
                </div>
                <div className="p-5">
                  <h2 className="font-display text-2xl leading-tight">
                    {short(a.name)} & {short(b.name)}
                  </h2>
                  <p className="mt-2 text-xs tracking-[0.14em] uppercase text-muted-foreground">
                    {labelOf(DATE_STYLES, d.style)} · {fmt(d.createdAt)}
                  </p>
                  {d.note ? (
                    <p className="mt-4 border-l border-ember/60 pl-3 text-sm leading-relaxed text-foreground/85">
                      {d.note}
                    </p>
                  ) : null}
                  {d.rating ? (
                    <p className="mt-4 text-xs text-muted-foreground">
                      Rated {d.rating}/5
                      {d.again ? ` · Again? ${d.again}` : ""}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Phone>
  );
}
