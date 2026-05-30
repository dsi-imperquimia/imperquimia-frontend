import { NotFound } from "@components/errorpages/NotFound";
import { queryClient } from "@lib/queryClient";
import type { AuthState } from "@modules/auth/store/authStore";
import { authStore } from "@modules/auth/store/authStore";
import type { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    // Initial context — root beforeLoad overrides with cookie/store value before any render.
    context: {
      auth: authStore.state,
      queryClient: queryClient,
    },
    defaultNotFoundComponent: () => <NotFound />,
  });

  // Keep router context in sync with in-memory store on client-side state changes.
  authStore.subscribe(() => {
    router.update({
      context: { auth: authStore.state, queryClient },
    });
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }

  interface RouterContext {
    auth: AuthState;
    queryClient: QueryClient;
  }
}
