import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppNav } from "@/components/lela/nav";
import { GhostButton, Phone, PrimaryButton } from "@/components/lela/shell";
import { createInvite, leaveCouple, signOut } from "@/lib/lela/account";
import { useAccount } from "@/lib/lela/useAccount";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your LELA profile" },
      {
        name: "description",
        content: "Your name, your account type, and your couple. Nothing social, nothing public.",
      },
      { property: "og:title", content: "Your LELA profile" },
      { property: "og:description", content: "Just you, your person, and your dates." },
    ],
  }),
  component: Profile,
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border px-5 py-4">
      <p className="overline">{label}</p>
      <p className="mt-1.5 text-sm text-foreground/90">{value}</p>
    </div>
  );
}

function Profile() {
  const navigate = useNavigate();
  const { ready, user, connected, isGuest } = useAccount();

  useEffect(() => {
    if (ready && !user) navigate({ to: "/welcome", replace: true });
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return (
      <Phone>
        <AppNav />
      </Phone>
    );
  }

  return (
    <Phone>
      <AppNav />

      <div className="flex items-center gap-4">
        {user.photo ? (
          <img src={user.photo} alt="" className="size-16 rounded-full object-cover" />
        ) : (
          <span aria-hidden className="flex size-16 items-center justify-center rounded-full border border-border text-xl">
            🤍
          </span>
        )}
        <div>
          <h1 className="display-lg text-[2rem] leading-none">{user.name}</h1>
          <p className="mt-2 text-xs tracking-[0.16em] uppercase text-muted-foreground">
            {isGuest ? "Guest" : "Member"}
          </p>
        </div>
      </div>

      <div className="mt-9 space-y-2.5">
        <Row label="Couple" value={connected ? "💕 Connected" : "Not connected yet"} />
        {user.email ? <Row label="Email" value={user.email} /> : null}
      </div>

      <div className="mt-9 space-y-2.5">
        {!connected ? (
          <PrimaryButton
            onClick={() => {
              createInvite();
              navigate({ to: "/invite" });
            }}
          >
            Invite Partner
          </PrimaryButton>
        ) : (
          <GhostButton
            onClick={() => {
              createInvite();
              navigate({ to: "/invite" });
            }}
          >
            Show Our Invite
          </GhostButton>
        )}
        {isGuest ? (
          <PrimaryButton onClick={() => navigate({ to: "/keep" })}>Keep My Dates</PrimaryButton>
        ) : null}
        <GhostButton
          onClick={() => {
            leaveCouple();
            navigate({ to: "/couple" });
          }}
        >
          Leave Couple
        </GhostButton>
        <GhostButton
          onClick={() => {
            signOut();
            navigate({ to: "/" });
          }}
        >
          Sign Out
        </GhostButton>
      </div>
    </Phone>
  );
}
