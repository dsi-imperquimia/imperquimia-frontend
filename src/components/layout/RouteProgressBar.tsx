import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

// Retraso antes de mostrar la barra, evita parpadeos en navegaciones instantáneas.
const SHOW_DELAY_MS = 150;

type Phase = "idle" | "loading" | "done";

export function RouteProgressBar() {
  const isLoading = useRouterState({ select: (s) => s.status === "pending" });
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setPhase("loading"), SHOW_DELAY_MS);
      return () => clearTimeout(timer);
    }

    setPhase((prev) => (prev === "loading" ? "done" : "idle"));
  }, [isLoading]);

  useEffect(() => {
    if (phase !== "done") return;
    const timer = setTimeout(() => setPhase("idle"), 400);
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <div
      role="progressbar"
      aria-hidden={phase === "idle"}
      aria-label="Cargando página"
      className="pointer-events-none fixed inset-x-0 top-0 z-9999 h-0.75"
      style={{ viewTransitionName: "route-progress" }}
    >
      <div
        className="h-full bg-accent shadow-[0_0_8px_var(--accent)]"
        style={{
          width: phase === "idle" ? "0%" : phase === "loading" ? "85%" : "100%",
          opacity: phase === "done" ? 0 : 1,
          transition:
            phase === "loading"
              ? "width 8s cubic-bezier(0.1, 0.8, 0.2, 1)"
              : phase === "done"
                ? "width 200ms ease-out, opacity 300ms ease 150ms"
                : "none",
        }}
      />
    </div>
  );
}
