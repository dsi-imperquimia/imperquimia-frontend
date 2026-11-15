import { FormActividadDiaria } from "@modules/actividades-diarias/components/FormActividadDiaria";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/actividades-diarias/create",
)({
  component: CrearActividadDiariaPage,
});

function CrearActividadDiariaPage() {
  return (
    <div className="space-y-5">
      <Link
        to="/actividades-diarias"
        className="text-sm text-blue-700 hover:underline"
      >
        ← Volver a actividades diarias
      </Link>
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
