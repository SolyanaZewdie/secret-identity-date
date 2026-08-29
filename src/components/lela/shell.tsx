import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Constrains the app experience to a phone-like column on any screen. */
export function Phone({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className="mx-auto w-full max-w-[30rem] px-5 pb-24 pt-6 sm:px-7">
      <div className={cn("animate-rise", className)}>{children}</div>
    </div>
  );
}

export function Wordmark({ className }: { className?: string | undefined }) {
  return (
    <Link
      to="/"
      className={cn(
        "font-display text-2xl tracking-[0.32em] text-foreground transition-opacity hover:opacity-70",
        className,
      )}
      aria-label="LELA home"
    >
      LELA
    </Link>
  );
}

export function StepHeader({
  step,
  title,
  copy,
  back,
}: {
  step?: string | undefined;
  title: string;
  copy?: string | undefined;
  back?: { to: string; label: string } | undefined;
}) {
  return (
    <header className="mb-8">
      <div className="flex items-center justify-between">
        <Wordmark className="text-lg" />
        {step ? <span className="overline">{step}</span> : null}
      </div>
      {back ? (
        <Link
          to={back.to}
          className="mt-6 inline-block text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
        >
          ← {back.label}
        </Link>
      ) : null}
      <h1 className="display-lg mt-6 text-balance">{title}</h1>
      {copy ? (
        <p className="mt-3 text-[0.98rem] leading-relaxed text-muted-foreground">{copy}</p>
      ) : null}
    </header>
  );
}

export function Section({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <section className={cn("mt-9", className)}>
      <h2 className="overline">{label}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function ChoiceGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2.5">{children}</div>;
}

export function ChoiceCard({
  emoji,
  label,
  note,
  sub,
  selected,
  onSelect,
  wide,
}: {
  emoji: string;
  label: string;
  note?: string | undefined;
  sub?: string | undefined;
  selected: boolean;
  onSelect: () => void;
  wide?: boolean | undefined;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "card-night group relative overflow-hidden rounded-xl px-4 py-4 text-left transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-ember/50",
        selected && "border-ember bg-ember/10 shadow-lift",
        wide && "col-span-2",
      )}
    >
      <div className="flex items-start gap-3">
        <span aria-hidden className="text-xl leading-none">
          {emoji}
        </span>
        <span className="flex-1">
          <span className="block text-sm font-medium tracking-wide text-foreground">
            {label}
          </span>
          {note ? (
            <span className="mt-1 block font-display text-lg leading-tight text-foreground/90">
              {note}
            </span>
          ) : null}
          {sub ? (
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              {sub}
            </span>
          ) : null}
        </span>
        <span
          aria-hidden
          className={cn(
            "mt-0.5 size-4 shrink-0 rounded-full border border-border transition-colors",
            selected && "border-ember bg-ember",
          )}
        />
      </div>
      <span className="sr-only">{selected ? "Selected" : "Not selected"}</span>
    </button>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: (() => void) | undefined;
  type?: "button" | "submit" | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full rounded-full bg-ember px-6 py-4 text-sm font-semibold tracking-[0.12em] text-ember-foreground uppercase",
        "transition-all duration-300 hover:brightness-110 active:scale-[0.99] disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: (() => void) | undefined;
  className?: string | undefined;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-full border border-border px-6 py-4 text-sm font-medium tracking-[0.12em] uppercase text-foreground/85",
        "transition-colors hover:border-foreground/40 hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function StickyBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[30rem] space-y-2.5 px-5 py-4 sm:px-7">
        {children}
      </div>
    </div>
  );
}

export function SecretNotice({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-ember/30 bg-ember/8 px-4 py-3 text-xs leading-relaxed text-foreground/85">
      <span aria-hidden>🔒</span>
      <span>{children}</span>
    </p>
  );
}
