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

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
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
      { name: "twitter:title", content: "Equit · Invierte como los grandes" },
      { name: "description", content: "Equit is a mobile-first financial app for young Spanish investors." },
      { property: "og:description", content: "Equit is a mobile-first financial app for young Spanish investors." },
      { name: "twitter:description", content: "Equit is a mobile-first financial app for young Spanish investors." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/88d5a4c5-32cd-489c-8b29-cb6f68e49676/id-preview-1fd0cb6b--f80304b0-47f6-42e1-990f-412ba9221ca9.lovable.app-1782839182954.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/88d5a4c5-32cd-489c-8b29-cb6f68e49676/id-preview-1fd0cb6b--f80304b0-47f6-42e1-990f-412ba9221ca9.lovable.app-1782839182954.png" },
      { name: "twitter:card", content: "summary_large_image" },
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
