import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GhostButton, Phone, PrimaryButton, SecretNotice } from "@/components/lela/shell";
import { loadCurrent, saveCurrent, setViewer, type Partner } from "@/lib/lela/session";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/begin/$partner")({
  head: () => ({
    meta: [
      { title: "Your date begins now — LELA" },
      { name: "description", content: "Go meet them. Don't reveal your character until you're face to face." },
      { property: "og:title", content: "Your date begins now — LELA" },
      { property: "og:description", content: "Have fun. Stay in character. Don't take it too seriously." },
    ],
  }),
  component: Begin,
});

function Begin() {
  const { partner } = Route.useParams();
  const navigate = useNavigate();
  const [otherReady, setOtherReady] = useState<boolean | null>(null);

  useEffect(() => {
    const current = loadCurrent();
    if (!current) {
      navigate({ to: "/create" });
      return;
    }
    const other: Partner = partner === "A" ? "B" : "A";
    setOtherReady(current[other].seen);
  }, [partner, navigate]);

  const start = () => {
    const current = loadCurrent();
    if (current) saveCurrent({ ...current, started: true });
    navigate({ to: "/date" });
  };

  const handOver = () => {
    setViewer(null);
    navigate({ to: "/partner" });
  };

  return (
    <Phone>
      <div className="pt-14">
        <p className="overline">Partner {partner}</p>
        <h1 className="display-lg mt-5">Your date begins now.</h1>
        <p className="mt-4 text-[0.98rem] leading-relaxed text-muted-foreground">
          Go meet them. Don't reveal your character until you're face-to-face.
        </p>

        <div className="mt-10 space-y-1.5 font-display text-3xl leading-tight">
          <p>Have fun.</p>
          <p className="text-ember">Stay in character.</p>
          <p className="text-foreground/70">Don't take it too seriously.</p>
        </div>

        <div className="mt-10">
          {otherReady === false ? (
            <>
              <SecretNotice>
                Partner {partner === "A" ? "B" : "A"} hasn't collected their identity yet.
                Lock your screen mentally and hand the phone over.
              </SecretNotice>
              <div className="mt-6 space-y-2.5">
                <PrimaryButton onClick={handOver}>Hand The Phone Over</PrimaryButton>
                <GhostButton onClick={start}>Skip — start the date</GhostButton>
              </div>
            </>
          ) : (
            <div className="space-y-2.5">
              <PrimaryButton onClick={start}>Start My Date</PrimaryButton>
              <GhostButton onClick={handOver}>Hand the phone over</GhostButton>
            </div>
          )}
        </div>
      </div>
    </Phone>
  );
}
