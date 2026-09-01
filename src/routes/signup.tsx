import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Phone,
  PrimaryButton,
  StepHeader,
} from "@/components/lela/shell";
import {
  Field,
  FormError,
  TextInput,
} from "@/components/lela/pairing";
import { signUp } from "@/lib/lela/account";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      {
        title: "Join LELA — Be someone else tonight.",
      },
      {
        name: "description",
        content:
          "Make a LELA account so your secret characters and date memories stay with you.",
      },
      {
        property: "og:title",
        content: "Join LELA",
      },
      {
        property: "og:description",
        content: "Two names, one secret each. Let's begin.",
      },
    ],
  }),
  component: SignUp,
});

function SignUp() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await signUp({
        name,
        email,
        password,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      navigate({ to: "/couple" });
    } catch (err) {
      console.error("Sign up failed:", err);

      setError(
        "Something went wrong while creating your account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
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

          if (!loading) {
            void submit();
          }
        }}
      >
        <Field label="Name">
          <TextInput
            value={name}
            onChange={setName}
            placeholder="What should we call you?"
            autoComplete="name"
            disabled={loading}
          />
        </Field>

        <Field label="Email">
          <TextInput
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="you@email.com"
            autoComplete="email"
            disabled={loading}
          />
        </Field>

        <Field label="Password">
          <TextInput
            value={password}
            onChange={setPassword}
            type="password"
            placeholder="At least 6 characters"
            autoComplete="new-password"
            disabled={loading}
          />
        </Field>

        <FormError>{error}</FormError>

        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Create My Account"}
        </PrimaryButton>
      </form>

      <p className="mt-7 text-center text-xs text-muted-foreground">
        Already here?{" "}
        <Link
          to="/signin"
          className="underline decoration-border underline-offset-4 hover:text-foreground"
        >
          Sign in
        </Link>
      </p>
    </Phone>
  );
}

