import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  GhostButton,
  Phone,
  PrimaryButton,
  StepHeader,
} from "@/components/lela/shell";
import {
  allCouples,
  coupleOf,
  currentUserAsync,
  currentUserId,
  resetEverything,
  setCurrentUser,
  setDevMode,
  type User,
} from "@/lib/lela/account";
import { useAccount } from "@/lib/lela/useAccount";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dev")({
  head: () => ({
    meta: [
      { title: "Prototype device switcher — LELA" },
      {
        name: "description",
        content: "Internal prototype tool for simulating two devices.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DevTools,
});

/**
 * Prototype-only device switcher.
 *
 * Authentication is now handled by Supabase, so there is no longer
 * a localStorage users collection to switch between.
 *
 * The current Supabase account is shown here for debugging, while
 * couples remain in the prototype localStorage layer for now.
 */
function DevTools() {
  const navigate = useNavigate();
  const { devMode, ready } = useAccount();

  const [user, setUser] = useState<User | null>(null);
  const [userReady, setUserReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      const current = await currentUserAsync();

      if (!cancelled) {
        setUser(current);
        setUserReady(true);
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const couples = ready ? allCouples() : [];
  const activeId = ready ? currentUserId() : null;
  const currentCouple = user ? coupleOf(user.id) : null;

  return (
    <Phone>
      <StepHeader
        title="Device switcher"
        copy="Prototype tool for inspecting the current account and couple state."
        back={{ to: "/", label: "Back to LELA" }}
      />

      <section className="space-y-2.5">
        {!userReady ? (
          <p className="text-sm text-muted-foreground">
            Loading current account…
          </p>
        ) : !user ? (
          <p className="text-sm text-muted-foreground">
            No one is signed in on this device.
          </p>
        ) : (
          <div className="card-night w-full rounded-2xl px-5 py-4">
            <span className="block font-display text-xl">
              {user.name}
            </span>

            <span className="mt-1 block text-xs text-muted-foreground">
              {user.kind} · {user.email ?? "no email"}
            </span>

            <span className="mt-1 block text-xs text-muted-foreground">
              {currentCouple
                ? `couple ${currentCouple.code}${
                    currentCouple.bId ? " (paired)" : " (waiting)"
                  }`
                : "no couple"}
            </span>

            <span className="mt-2 block text-[0.65rem] uppercase tracking-[0.18em] text-ember">
              This device
            </span>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="overline">Couples</h2>

        {couples.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            No prototype couples yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            {couples.map((c) => (
              <li key={c.id}>
                {c.code} · {c.id} · A {c.aId} · B {c.bId ?? "—"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-9 space-y-2.5 pb-6">
        <GhostButton onClick={() => setDevMode(!devMode)}>
          {devMode ? "Hide floating switcher" : "Show floating switcher"}
        </GhostButton>

        <GhostButton
          onClick={() => {
            setCurrentUser(null);
            navigate({ to: "/" });
          }}
        >
          Sign this device out
        </GhostButton>

        <PrimaryButton
          onClick={() => {
            resetEverything();
            navigate({ to: "/" });
          }}
        >
          Reset prototype data
        </PrimaryButton>
      </div>
    </Phone>
  );
}
