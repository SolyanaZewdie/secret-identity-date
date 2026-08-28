import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <p className="text-4xl" aria-hidden>
          🔒
        </p>
        <h1 className="display-lg mt-5">Nothing here.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Whatever this was, it's someone else's secret.
        </p>
        <Link
          to="/"
          className="mt-7 inline-flex rounded-full bg-ember px-6 py-3 text-xs font-semibold tracking-[0.14em] uppercase text-ember-foreground"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="display-lg">This page didn't load.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Something went wrong on our end. Try again, or start the night over.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-full bg-ember px-6 py-3 text-xs font-semibold tracking-[0.14em] uppercase text-ember-foreground"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-full border border-border px-6 py-3 text-xs font-semibold tracking-[0.14em] uppercase"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LELA — Be someone else tonight." },
      {
        name: "description",
        content:
          "LELA gives you and your partner a secret character for your real date. You won't know who they became until you meet.",
      },
      { property: "og:title", content: "LELA — Be someone else tonight." },
      {
        property: "og:description",
        content:
          "Secret characters for your next date. Dress the part, meet in person, find out who they became.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Work+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
