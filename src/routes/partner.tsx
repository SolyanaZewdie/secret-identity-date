import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Phone, PrimaryButton, SecretNotice, StepHeader } from "@/components/lela/shell";
import { useCurrentSession } from "@/lib/lela/useSession";
import { setViewer, type Partner } from "@/lib/lela/session";

export const Route = createFileRoute("/partner")({
  head: () => ({
    meta: [
      { title: "Who's looking? — LELA" },
      {
        name: "description",
        content: "Pick which partner is holding the phone. Your character stays private.",
      },
      { property: "og:title", content: "Who's looking? — LELA" },
      { property: "og:description", content: "Make sure your partner isn't looking at your screen." },
    ],
  }),
  component: PartnerSelect;
});

function PartnerSelect() {
  const navigate = useNavigate();
  const { session, ready } = useCurrentSession();

  const go = (partner: Partner) => {
    setViewer(partner);
    navigate({ to: "/reveal/$partner", params: { partner } });
  };

  if (ready && !session) {
    return (
      <Phone>
        <StepHeader title="No date in progress." copy="Start a night first." />
        <Link
          to="/create"
          className="block rounded-full bg-ember px-6 py-4 text-center text-xs font-semibold tracking-[0.16em] uppercase text-ember-foreground"
        >
          Create a Date
        </Link>
      </Phone>
    );
  }

  return (
    <Phone>
      <StepHeader
        step="Step 2 of 3"
        title="Who's looking?"
        copy="One phone, two secrets. Read yours, then hand it over."
      />

      <div className="space-y-3">
        {(["A", "B"] as Partner[]).map((p) => {
          const seen = session?.[p].seen;
          return (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              className="card-night flex w-full items-center justify-between rounded-2xl px-5 py-6 text-left transition-all hover:-translate-y-0.5 hover:border-ember/50"
            >
              <span>
                <span className="block font-display text-2xl">I'm Partner {p}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {seen ? "Identity already collected" : "Identity waiting"}
                </span>
              </span>
              <span aria-hidden className="text-lg text-ember">
                {seen ? "✓" : "→"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-7">
        <SecretNotice>Make sure your partner isn't looking at your screen.</SecretNotice>
      </div>

      {session?.A.seen && session?.B.seen ? (
        <div className="mt-8">
          <PrimaryButton onClick={() => navigate({ to: "/date" })}>
            Both ready — start the date
          </PrimaryButton>
        </div>
      ) : null}
    </Phone>
  );
}
