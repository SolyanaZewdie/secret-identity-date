import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, PrimaryButton, StepHeader } from "@/components/lela/shell";
import { Field, FormError, TextInput } from "@/components/lela/pairing";
import { signUp } from "@/lib/lela/account";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Join LELA — Be someone else tonight." },
      {
        name: "description",
        content: "Make a LELA account so your secret characters and date memories stay with you.",
      },
      { property: "og:title", content: "Join LELA" },
      { property: "og:description", content: "Two names, one secret each. Let's begin." },
    ],
  }),
  component: SignUp,
});

function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const result = signUp({
      name,
      email,
      password,
      ...(photo ? { photo } : {}),
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate({ to: "/couple" });
  };

  const pickPhoto = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <Phone>
      <StepHeader
        title="Let's make you someone."
        copy="Two minutes now, and every ridiculous night you have stays yours."
        back={{ to: "/welcome", label: "Back" }}
      />

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="Name">
          <TextInput value={name} onChange={setName} placeholder="What should we call you?" autoComplete="name" />
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

        <div>
          <span className="overline">Photo (optional)</span>
          <div className="mt-2 flex items-center gap-4">
            {photo ? (
              <img src={photo} alt="Your photo" className="size-14 rounded-full object-cover" />
            ) : (
              <span aria-hidden className="flex size-14 items-center justify-center rounded-full border border-border text-lg">
                🤍
              </span>
            )}
            <label className="cursor-pointer rounded-full border border-border px-5 py-3 text-xs font-semibold tracking-[0.14em] uppercase text-foreground/85">
              Choose
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickPhoto(e.target.files?.[0])}
              />
            </label>
          </div>
        </div>

        <FormError>{error}</FormError>

        <PrimaryButton type="submit">Create My Account</PrimaryButton>
      </form>

      <p className="mt-7 text-center text-xs text-muted-foreground">
        Already here?{" "}
        <Link to="/signin" className="underline decoration-border underline-offset-4 hover:text-foreground">
          Sign in
        </Link>
      </p>
    </Phone>
  );
}
