import { cn } from "@/lib/utils";

/** A concealed identity card — used on the landing hero and hand-off screens. */
export function VeiledCard({
  label,
  className,
  tilt = "left",
}: {
  label: string;
  className?: string;
  tilt?: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "card-night relative aspect-[3/4.4] w-full overflow-hidden rounded-2xl",
        tilt === "left" ? "-rotate-6" : "rotate-6",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, var(--veil) 0 6px, transparent 6px 12px)",
        }}
      />
      <div
        aria-hidden
        className="absolute -inset-16 bg-[radial-gradient(circle_at_30%_20%,var(--orchid),transparent_60%)] opacity-30 blur-2xl"
      />
      <div className="relative flex h-full flex-col justify-between p-4">
        <span className="overline text-[0.55rem]">{label}</span>
        <div className="flex flex-1 items-center justify-center">
          <span className="font-display text-5xl text-foreground/25" aria-hidden>
            ?
          </span>
        </div>
        <div className="space-y-1.5" aria-hidden>
          <span className="block h-1.5 w-3/4 rounded-full bg-foreground/12" />
          <span className="block h-1.5 w-1/2 rounded-full bg-foreground/10" />
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-foreground/10"
      />
    </div>
  );
}
