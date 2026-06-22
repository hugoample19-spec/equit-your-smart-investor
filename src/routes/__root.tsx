import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppProvider } from "../lib/app-context";
import { Layout } from "../components/Layout";
import { Toaster } from "../components/ui/sonner";
import { CONTENT_SECURITY_POLICY } from "../lib/csp";

function NotFoundComponent() {
  return (
    <div className="pt-20 text-center">
      <h1 className="text-5xl font-semibold" style={{ color: "var(--navy)" }}>
        404
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
        Página no encontrada
      </p>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "root" });
  }, [error]);
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-lg font-semibold">Algo ha fallado</h1>
        <p className="text-sm mt-2 text-muted-foreground">Inténtalo de nuevo.</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-4 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Equit · Invierte como los grandes" },
      {
        name: "description",
        content:
          "Equit: plataforma de inversión social para jóvenes en España. Sigue a los grandes inversores, genera carteras con IA y mejora tus finanzas.",
      },
      { name: "theme-color", content: "#FAF8F5" },
      { httpEquiv: "Content-Security-Policy", content: CONTENT_SECURITY_POLICY },
      { property: "og:title", content: "Equit · Invierte como los grandes" },
      {
        property: "og:description",
        content: "Sigue a los grandes inversores y genera carteras con IA.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
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
      <AppProvider>
        <Layout>
          <Outlet />
        </Layout>
        <Toaster />
      </AppProvider>
    </QueryClientProvider>
  );
}
