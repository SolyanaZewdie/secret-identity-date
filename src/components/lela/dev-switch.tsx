import { allUsers, currentUserId, setCurrentUser } from "@/lib/lela/account";
import { useAccount } from "@/lib/lela/useAccount";

/**
 * Prototype-only floating device switcher. Hidden unless explicitly enabled
 * from /dev, so it never appears in the polished experience.
 */
export function DevSwitch() {
  const { devMode, ready } = useAccount();
  if (!ready || !devMode) return null;
  const users = allUsers();
  const active = currentUserId();

  return (
    <div className="fixed bottom-3 left-3 z-50 flex max-w-[14rem] flex-wrap gap-1.5 rounded-xl border border-border bg-card/95 p-2 text-[0.6rem] backdrop-blur">
      {users.map((u) => (
        <button
          key={u.id}
          type="button"
          onClick={() => setCurrentUser(u.id)}
          className={`rounded-full px-2.5 py-1 tracking-[0.1em] uppercase ${
            active === u.id ? "bg-ember text-ember-foreground" : "border border-border text-muted-foreground"
          }`}
        >
          {u.name}
        </button>
      ))}
    </div>
  );
}
