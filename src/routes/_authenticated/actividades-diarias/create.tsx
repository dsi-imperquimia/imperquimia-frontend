import { createFileRoute, Navigate } from "@tanstack/react-router";

export interface CrearActividadSearch {
  proyectoId?: number;
}

export const Route = createFileRoute(
  "/_authenticated/actividades-diarias/create",
)({
  validateSearch: (search: Record<string, unknown>): CrearActividadSearch => {
    const raw = Number(search?.proyectoId);
    return Number.isInteger(raw) && raw > 0 ? { proyectoId: raw } : {};
  },
  component: CrearActividadDiariaRedirect,
});

function CrearActividadDiariaRedirect() {
  return <Navigate to="/actividades-diarias" replace />;
}
