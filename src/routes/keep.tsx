import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GhostButton, Phone, PrimaryButton, StepHeader } from "@/components/lela/shell";
import { Field, FormError, TextInput } from "@/components/lela/pairing";
import { convertGuest } from "@/lib/lela/account";
import { useAccount } from "@/lib/lela/useAccount";

export const Route = createFileRoute("/keep")({
  head: () => ({
    meta: [
      { title: "Keep this memory — LELA" },
      {
        name: "description",
        content: "Create a LELA account and your guest dates come with you, exactly as they are.",
      },
      { property: "og:title", content: "Keep this memory — LELA" },
      { property: "og:description", content: "Your dates are coming with you. ❤️" },
    ],
  }),
  component: Keep,
});

function Keep() {
  const navigate = useNavigate();
  const { user } = useAccount();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const result = convertGuest({ name: name || user?.name || "", email, password });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate({ to: "/home" });
  };

  return (
    <Phone>
      <StepHeader
        title="Your dates are coming with you. ❤️"
        copy="Create an account and we'll keep your LELA memories — the couple, the characters, all of it."
      />

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="Name">
          <TextInput value={name} onChange={setName} placeholder={user?.name ?? "Your name"} autoComplete="name" />
        </Field>
        <Field label="Email">
          <TextInput value={email} onChange={setEmail} type="email" placeholder="you@email.com" autoComplete="email" />
        </Field>
        <Field label="Password">
          <TextInput
            value={password}
            onChange={setPassword}
            type="password"
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
        </Field>

        <FormError>{error}</FormError>

        <PrimaryButton type="submit">Create an Account</PrimaryButton>
      </form>

      <div className="mt-4">
        <GhostButton onClick={() => navigate({ to: "/home" })}>Maybe Later</GhostButton>
      </div>
    </Phone>
  );
}
