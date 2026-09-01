import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GhostButton, Phone, PrimaryButton, StepHeader } from "@/components/lela/shell";
import { CodeInput, FormError } from "@/components/lela/pairing";
import { createGuest, currentUser, joinCouple } from "@/lib/lela/account";

export const Route = createFileRoute("/join/")({
  head: () => ({
    meta: [
      { title: "Join your person — LELA" },
      {
        name: "description",
        content: "Enter the six-digit couple code your partner is holding and join their LELA date.",
      },
      { property: "og:title", content: "Join your person — LELA" },
      { property: "og:description", content: "Ask your partner for their code and join their date." },
    ],
  }),
  component: JoinByCode,
});

function JoinByCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!currentUser()) createGuest();
    const result = joinCouple(code);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate({ to: "/connected" });
  };

  return (
    <Phone>
      <StepHeader
        title="Join your person."
        copy="Enter the code they're holding. Six characters, nothing else needed."
        back={{ to: "/", label: "Back" }}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <span className="overline">Couple code</span>
        <CodeInput value={code} onChange={setCode} />
        <div className="mt-5 space-y-3">
          <FormError>{error}</FormError>
          <PrimaryButton type="submit">Join Couple</PrimaryButton>
        </div>
      </form>

      <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
        Can't scan their QR code? This works exactly the same way.
      </p>

      <div className="mt-6">
        <GhostButton onClick={() => navigate({ to: "/welcome" })}>I'd rather start my own</GhostButton>
      </div>
    </Phone>
  );
}
