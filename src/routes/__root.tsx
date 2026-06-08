import "@styles/styles.css";

import { Toast } from "@heroui/react/toast";
import { queryClient } from "@lib/queryClient";
import { authStore } from "@modules/auth/store/authStore";
import { getAuth } from "@modules/auth/utils/get-auth-store";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  type RouterContext,
} from "@tanstack/react-router";

function NotFound() {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-lg text-gray-600">Página no encontrada</p>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const auth =
      typeof window === "undefined"
        ? await getAuth() // SSR: lee cookie del request
        : authStore.state; // cliente: usa store ya hidratado desde localStorage
    return { auth };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Imperquimia" },
    ],
    links: [
      { rel: "icon", href: "/favicon-16x16.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Manrope:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="h-screen overflow-hidden bg-white font-sans antialiased">
        <Toast.Provider placement="top end" />
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
