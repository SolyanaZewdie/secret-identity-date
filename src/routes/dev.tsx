import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GhostButton, Phone, PrimaryButton, StepHeader } from "@/components/lela/shell";
import {
  allCouples,
  allUsers,
  coupleOf,
  currentUserId,
  resetEverything,
  setCurrentUser,
  setDevMode,
} from "@/lib/lela/account";
import { useAccount } from "@/lib/lela/useAccount";

export const Route = createFileRoute("/dev")({
  head: () => ({
    meta: [
      { title: "Prototype device switcher — LELA" },
      { name: "description", content: "Internal prototype tool for simulating two devices." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DevTools,
});

/** Prototype-only: simulates Device A / Device B in one browser. Not linked from the app UI. */
function DevTools() {
  const navigate = useNavigate();
  const { devMode, ready } = useAccount();
  const users = ready ? allUsers() : [];
  const couples = ready ? allCouples() : [];
  const activeId = ready ? currentUserId() : null;

  return (
    <Phone>
      <StepHeader
        title="Device switcher"
        copy="Prototype tool. Switch which person's phone this browser is pretending to be."
        back={{ to: "/", label: "Back to LELA" }}
      />

      <section className="space-y-2.5">
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No people yet. Create an account or a guest session first.
          </p>
        ) : (
          users.map((u) => {
            const couple = coupleOf(u.id);
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => setCurrentUser(u.id)}
                className={`card-night w-full rounded-2xl px-5 py-4 text-left ${
                  activeId === u.id ? "border-ember bg-ember/10" : ""
                }`}
              >
                <span className="block font-display text-xl">{u.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {u.kind} · {u.email ?? "no email"} ·{" "}
                  {couple ? `couple ${couple.code}${couple.bId ? " (paired)" : " (waiting)"}` : "no couple"}
                </span>
                <span className="mt-1 block text-[0.65rem] tracking-[0.18em] uppercase text-ember">
                  {activeId === u.id ? "This device" : "Switch to this device"}
                </span>
              </button>
            );
          })
        )}
      </section>

      <section className="mt-8">
        <h2 className="overline">Couples</h2>
        <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          {couples.map((c) => (
            <li key={c.id}>
              {c.code} · {c.id} · A {c.aId} · B {c.bId ?? "—"}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-9 space-y-2.5 pb-6">
        <GhostButton onClick={() => setDevMode(!devMode)}>
          {devMode ? "Hide floating switcher" : "Show floating switcher"}
        </GhostButton>
        <GhostButton onClick={() => setCurrentUser(null)}>Sign this device out</GhostButton>
        <PrimaryButton
          onClick={() => {
            resetEverything();
            navigate({ to: "/" });
          }}
        >
          Reset all prototype data
        </PrimaryButton>
      </div>
    </Phone>
  );
}
