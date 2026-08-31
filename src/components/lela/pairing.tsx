import { QRCodeSVG } from "qrcode.react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { inviteMessage, joinUrl } from "@/lib/lela/account";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string | undefined;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="overline">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string | undefined;
  placeholder?: string | undefined;
  autoComplete?: string | undefined;
  className?: string | undefined;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className={cn(
        "mt-2 w-full rounded-2xl border border-input bg-card px-4 py-3.5 text-sm text-foreground",
        "placeholder:text-muted-foreground/70 focus:border-ember/70 focus:outline-none",
        className,
      )}
    />
  );
}

export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-xs text-foreground/90">
      {children}
    </p>
  );
}

/** The invitation card — QR code, couple code, and human copy. */
export function InviteCard({ code }: { code: string }) {
  const [copied, setCopied] = useState<"none" | "code" | "invite">("none");

  const copy = async (what: "code" | "invite") => {
    const text = what === "code" ? code : inviteMessage(code);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      window.setTimeout(() => setCopied("none"), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const share = async () => {
    const text = inviteMessage(code);
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "LELA", text, url: joinUrl(code) });
        return;
      } catch {
        /* dismissed — fall through to copying */
      }
    }
    await copy("invite");
  };

  return (
    <div className="card-night overflow-hidden rounded-3xl">
      <div className="border-b border-border px-6 py-5 text-center">
        <p className="overline text-ember">Scan to join</p>
        <p className="mt-2 font-display text-2xl leading-tight">
          Your partner can scan this with their phone camera.
        </p>
      </div>

      <div className="flex justify-center px-6 py-8">
        <div className="rounded-2xl bg-parchment p-4 shadow-lift">
          <QRCodeSVG value={joinUrl(code)} size={188} level="M" marginSize={0} />
        </div>
      </div>

      <div className="px-6 pb-7 text-center">
        <p className="overline">Couple code</p>
        <p className="mt-2 font-mono text-3xl tracking-[0.3em] text-foreground">{code}</p>
        <p className="mt-3 text-xs text-muted-foreground">Or enter the code manually.</p>

        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            onClick={() => copy("code")}
            className="w-full rounded-full border border-border px-6 py-3.5 text-xs font-semibold tracking-[0.16em] uppercase text-foreground/85 transition-colors hover:border-foreground/40"
          >
            {copied === "code" ? "Copied ✓" : "Copy code"}
          </button>
          <button
            type="button"
            onClick={share}
            className="w-full rounded-full bg-ember px-6 py-3.5 text-xs font-semibold tracking-[0.16em] uppercase text-ember-foreground transition-all hover:brightness-110"
          >
            {copied === "invite" ? "Invite copied ✓" : "Share invite"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CodeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
      placeholder="7K4P92"
      inputMode="text"
      autoCapitalize="characters"
      aria-label="Couple code"
      className="mt-3 w-full rounded-2xl border border-input bg-card px-4 py-5 text-center font-mono text-2xl tracking-[0.36em] text-foreground placeholder:text-muted-foreground/50 focus:border-ember/70 focus:outline-none"
    />
  );
}

export function StatusRow({
  state,
  label,
  note,
}: {
  state: "ready" | "waiting";
  label: string;
  note?: string | undefined;
}) {
  return (
    <div className="card-night flex items-center gap-4 rounded-2xl px-5 py-4">
      <span aria-hidden className={state === "ready" ? "text-lg" : "text-lg text-muted-foreground"}>
        {state === "ready" ? "💕" : "○"}
      </span>
      <span>
        <span className="block text-sm text-foreground/90">{label}</span>
        {note ? <span className="mt-0.5 block text-xs text-muted-foreground">{note}</span> : null}
      </span>
    </div>
  );
}
