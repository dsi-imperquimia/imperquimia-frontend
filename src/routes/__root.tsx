import "@styles/styles.css";

import type { AuthState } from "@modules/auth/store/authStore";
import { authStore } from "@modules/auth/store/authStore";
import { STORAGE_KEY } from "@modules/auth/const/StorageKey";
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

const getAuthFromCookie = createServerFn({ method: "GET" }).handler(
  (): AuthState => {
    const raw = getCookie(STORAGE_KEY);
    if (!raw) return { isAuthenticated: false, user: null, accessToken: null };
    try {
      return JSON.parse(decodeURIComponent(raw)) as AuthState;
    } catch {
      return { isAuthenticated: false, user: null, accessToken: null };
    }
  },
);

interface RouterContext {
  auth: AuthState;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const auth =
      typeof window === "undefined"
        ? await getAuthFromCookie() // SSR: lee cookie del request
        : authStore.state; // cliente: usa store ya hidratado desde localStorage
    return { auth };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Imperquimia" },
    ],
    links: [{ rel: "icon", href: "/favicon-16x16.png" }],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="h-screen overflow-hidden bg-white font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
