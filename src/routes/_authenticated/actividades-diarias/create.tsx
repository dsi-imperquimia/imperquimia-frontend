import { FormActividadDiaria } from "@modules/actividades-diarias/components/FormActividadDiaria";
import { createFileRoute } from "@tanstack/react-router";

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
  component: CrearActividadDiariaPage,
});

function CrearActividadDiariaPage() {
  const { proyectoId } = Route.useSearch();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">
          Crear registro de actividad diaria
        </h1>
        <p className="text-sm text-gray-500">
          Busca y selecciona tu proyecto asignado para documentar la jornada.
        </p>
      </div>
      <FormActividadDiaria selectedProyectoId={proyectoId ?? null} />
    </div>
  );
}
