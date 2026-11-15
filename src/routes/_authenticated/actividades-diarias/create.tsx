import { FormActividadDiaria } from "@modules/actividades-diarias/components/FormActividadDiaria";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/actividades-diarias/create",
)({
  component: CrearActividadDiariaPage,
});

function CrearActividadDiariaPage() {
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
      <FormActividadDiaria />
    </div>
  );
}
