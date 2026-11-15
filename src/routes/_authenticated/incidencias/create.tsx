import { FormIncidencia } from "@modules/incidencias/components/FormIncidencia";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/incidencias/create")({
  component: CrearIncidenciaPage,
});

function CrearIncidenciaPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Registrar incidencia</h1>
        <p className="text-sm text-gray-500">
          Describe lo ocurrido en obra y asígnale una prioridad. Quedará abierta
          para su seguimiento.
        </p>
      </div>
      <FormIncidencia />
    </div>
  );
}
