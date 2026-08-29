import type { Character } from "@/lib/lela/characters";
import { cn } from "@/lib/utils";

export function CharacterCard({
  character,
  className,
  compact,
}: {
  character: Character;
  className?: string | undefined;
  compact?: boolean | undefined;
}) {
  return (
    <article className={cn("card-night animate-veil rounded-3xl p-6", className)}>
      <p className="text-5xl" aria-hidden>
        {character.emoji}
      </p>
      <h2 className="mt-4 font-display text-[2rem] leading-[1.05] tracking-tight uppercase">
        {character.name}
      </h2>
      <p className="mt-4 text-[0.95rem] leading-relaxed text-foreground/85">
        {character.description}
      </p>

      {compact ? null : (
        <div className="mt-7 space-y-6">
          <Block label="Your energy">
            <p className="text-sm text-foreground/90">{character.energy.join(" · ")}</p>
          </Block>

          <Block label="How to act">
            <ul className="space-y-2">
              {character.act.map((line) => (
                <li key={line} className="flex gap-2.5 text-sm leading-relaxed">
                  <span aria-hidden className="text-ember">
                    —
                  </span>
                  <span className="text-foreground/85">{line}</span>
                </li>
              ))}
            </ul>
          </Block>

          <Block label="How to dress">
            <p className="text-sm leading-relaxed text-foreground/85">{character.dress}</p>
          </Block>

          <Block label="Your voice">
            <p className="text-sm leading-relaxed text-foreground/85">{character.voice}</p>
          </Block>

          <Block label="Your character rule">
            <p className="rounded-xl border border-ember/35 bg-ember/8 px-4 py-3 font-display text-lg leading-snug">
              {character.rule}
            </p>
          </Block>

          {character.starter ? (
            <Block label="Your starter line">
              <p className="font-display text-xl leading-snug italic text-foreground/95">
                “{character.starter}”
              </p>
            </Block>
          ) : null}
        </div>
      )}
    </article>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="overline">{label}</h3>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}
