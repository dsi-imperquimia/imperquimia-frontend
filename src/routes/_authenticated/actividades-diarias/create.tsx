import { FormActividadDiaria } from "@modules/actividades-diarias/components/FormActividadDiaria";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/actividades-diarias/create",
)({
  validateSearch: (
    search: Record<string, unknown>,
  ): { proyectoId?: number } => {
    const raw = Number(search.proyectoId);
    return Number.isInteger(raw) && raw > 0 ? { proyectoId: raw } : {};
  },
  component: CrearActividadDiariaPage,
});

function CrearActividadDiariaPage() {
  const { proyectoId } = Route.useSearch();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Crear registro de actividad diaria</h1>
      <FormActividadDiaria selectedProyectoId={proyectoId} />
    </div>
  );
}
