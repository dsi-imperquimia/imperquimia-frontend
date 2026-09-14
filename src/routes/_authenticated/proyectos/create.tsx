import { createFileRoute } from "@tanstack/react-router";
import { FormProyecto } from "@modules/proyectos/components/FormProyecto";
export const Route = createFileRoute("/_authenticated/proyectos/create")({
  component: () => (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Crear proyecto</h1>
      <FormProyecto />
    </div>
  ),
});
