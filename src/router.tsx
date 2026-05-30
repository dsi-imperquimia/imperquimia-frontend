import type { AuthState } from "@modules/auth/store/authStore";
import { authStore } from "@modules/auth/store/authStore";
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
    },
  });

  // Keep router context in sync with in-memory store on client-side state changes.
  authStore.subscribe(() => {
    router.update({ context: { auth: authStore.state } });
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }

  interface RouterContext {
    auth: AuthState;
  }
}
