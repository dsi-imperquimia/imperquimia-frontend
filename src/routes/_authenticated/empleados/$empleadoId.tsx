import { Card } from "@heroui/react";
import { handleApiError } from "@modules/core/utils/handleApiError";
import { getEmpleado } from "@modules/empleados/api/get-empleado";
import { FormEmpleado } from "@modules/empleados/components/FormEmpleado";
import { createFileRoute } from "@tanstack/react-router";
import { UserPen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/empleados/$empleadoId")({
  params: {
    parse: ({ empleadoId }) => ({ empleadoId: Number(empleadoId) }),
    stringify: ({ empleadoId }) => ({ empleadoId: empleadoId.toString() }),
  },
  loader: async ({ params }) => {
    const { empleadoId } = params;
    return await getEmpleado(empleadoId).catch(handleApiError);
  },
  component: RouteComponent,
});

function RouteComponent() {
  const empleado = Route.useLoaderData();

  return (
    <Card className="w-full max-w-md" variant="transparent">
      <Card.Header className="font-medium text-lg flex flex-row items-center gap-2">
        <UserPen className="text-muted inline" />
        Editar empleado
      </Card.Header>
      <Card.Content>
        <FormEmpleado empleado={empleado} />
      </Card.Content>
    </Card>
  );
}
