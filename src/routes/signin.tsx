import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  GhostButton,
  Phone,
  PrimaryButton,
  StepHeader,
} from "@/components/lela/shell";
import {
  Field,
  FormError,
  TextInput,
} from "@/components/lela/pairing";
import {
  coupleOf,
  createGuest,
  isConnected,
  signIn,
} from "@/lib/lela/account";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      {
        title: "Welcome back — LELA",
      },
      {
        name: "description",
        content:
          "Sign in to LELA to find your person and start another night as someone else.",
      },
      {
        property: "og:title",
        content: "Welcome back — LELA",
      },
      {
        property: "og:description",
        content: "Your person is waiting. Sign in and start a date.",
      },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [hint, setHint] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await signIn(email, password);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const couple = coupleOf(result.user.id);

      navigate({
        to: isConnected(couple) ? "/home" : "/couple",
      });
    } catch (err) {
      console.error("Sign in failed:", err);

      setError(
        "Something went wrong while signing you in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Phone>
      <StepHeader
        title="Welcome back."
        copy="Let's see who you'll be tonight."
        back={{ to: "/", label: "Back" }}
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
            placeholder="Your password"
            autoComplete="current-password"
            disabled={loading}
          />
        </Field>

        <FormError>{error}</FormError>

        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </PrimaryButton>
      </form>

      <button
        type="button"
        onClick={() => setHint(true)}
        className="mt-5 block w-full text-center text-xs text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
      >
        Forgot password?
      </button>

      {hint ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Password recovery isn't available in this prototype yet. You can
          create a new account or continue as a guest.
        </p>
      ) : null}

      <div className="mt-9 space-y-3">
        <GhostButton
          onClick={() => {
            if (loading) return;

            createGuest();
            navigate({ to: "/guest" });
          }}
        >
          Continue as Guest
        </GhostButton>

        <p className="text-center text-xs text-muted-foreground">
          New here?{" "}
          <Link
            to="/signup"
            className="underline decoration-border underline-offset-4 hover:text-foreground"
          >
            Create an account
          </Link>
        </p>
      </div>
    </Phone>
  );
}

