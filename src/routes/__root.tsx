import "@styles/styles.css";

import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { AppSidebar } from "@/components/layout/AppSidebar";

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

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Imperquimia" },
    ],
    links: [{ rel: "icon", href: "/favicon-16x16.png" }],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="h-screen overflow-hidden bg-white font-sans antialiased">
        <div className="flex h-full">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <AppNavbar />
            <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
              {children}
            </main>
          </div>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
