import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChoiceCard,
  ChoiceGrid,
  Phone,
  Section,
  StepHeader,
  StickyBar,
  PrimaryButton,
} from "@/components/lela/shell";
import { DATE_STYLES, INTENSITIES, VIBES, type DateStyle, type Intensity } from "@/lib/lela/data";
import type { Vibe } from "@/lib/lela/characters";
import { generateSession, saveCurrent, setViewer } from "@/lib/lela/session";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create a date — LELA" },
      {
        name: "description",
        content:
          "Choose the vibe, how much character, and the kind of night. LELA hands you each a secret persona.",
      },
      { property: "og:title", content: "Create a date — LELA" },
      {
        property: "og:description",
        content: "Let's make tonight interesting. Pick a vibe and get your secret characters.",
      },
    ],
  }),
  component: CreateDate,
});

function CreateDate() {
  const navigate = useNavigate();
  const [vibe, setVibe] = useState<Vibe>("surprise");
  const [intensity, setIntensity] = useState<Intensity>("medium");
  const [style, setStyle] = useState<DateStyle>("surprise");

  const generate = () => {
    saveCurrent(generateSession({ vibe, intensity, style }));
    setViewer(null);
    navigate({ to: "/generating" });
  };

  return (
    <Phone>
      <StepHeader
        step="Step 1 of 3"
        title="Let's make tonight interesting."
        copy="You'll each receive a secret character. Choose the kind of night you want."
        back={{ to: "/", label: "Back" }}
      />

      <Section label="Vibe">
        <ChoiceGrid>
          {VIBES.map((v) => (
            <ChoiceCard
              key={v.value}
              emoji={v.emoji}
              label={v.label}
              selected={vibe === v.value}
              onSelect={() => setVibe(v.value)}
              wide={v.value === "surprise"}
            />
          ))}
        </ChoiceGrid>
      </Section>

      <Section label="How much character?">
        <div className="space-y-2.5">
          {INTENSITIES.map((i) => (
            <ChoiceCard
              key={i.value}
              emoji={i.emoji}
              label={i.label.toUpperCase()}
              note={i.note}
              sub={i.sub}
              selected={intensity === i.value}
              onSelect={() => setIntensity(i.value)}
              wide
            />
          ))}
        </div>
      </Section>

      <Section label="Date setting (optional)">
        <ChoiceGrid>
          {DATE_STYLES.map((d) => (
            <ChoiceCard
              key={d.value}
              emoji={d.emoji}
              label={d.label}
              selected={style === d.value}
              onSelect={() => setStyle(d.value)}
              wide={d.value === "plans"}
            />
          ))}
        </ChoiceGrid>
        {style === "plans" ? (
          <p className="mt-3 font-display text-xl leading-snug text-ember">
            Perfect. LELA will work around your date.
          </p>
        ) : (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            LELA doesn't pick the place. That part is yours.
          </p>
        )}
      </Section>

      <StickyBar>
        <PrimaryButton onClick={generate}>Generate Our Characters</PrimaryButton>
      </StickyBar>
    </Phone>
  );
}
