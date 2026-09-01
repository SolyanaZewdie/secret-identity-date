import { Link } from "@tanstack/react-router";
import { Wordmark } from "./shell";
import { useAccount } from "@/lib/lela/useAccount";

const LINKS = [
  { to: "/home", label: "Home" },
  { to: "/dates", label: "Our Dates" },
  { to: "/profile", label: "Profile" },
] as const;

/**
 * Minimal authenticated chrome. Guests get an even shorter version —
 * no account surface, just the night itself.
 */
export function AppNav() {
  const { isGuest, ready } = useAccount();
  const links = !ready || isGuest ? LINKS.filter((l) => l.label !== "Profile") : LINKS;

  return (
    <header className="mb-8 flex items-center justify-between">
      <Wordmark className="text-lg" />
      <nav className="flex items-center gap-4">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            activeProps={{ className: "text-foreground" }}
            className="text-xs tracking-[0.16em] uppercase text-muted-foreground transition-colors hover:text-foreground"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
