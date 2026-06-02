import { Card } from "@heroui/react";
import { handleApiError } from "@modules/core/utils/handleApiError";
import { getCargo } from "@modules/cargo-empleado/api/get-cargo";
import { FormCargoEmpleado } from "@modules/cargo-empleado/components/FormCargoEmpleado";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cargo-empleado/$cargoId")({
  params: {
    parse: ({ cargoId }) => ({ cargoId: Number(cargoId) }),
    stringify: ({ cargoId }) => ({ cargoId: cargoId.toString() }),
  },
  loader: async ({ params }) => {
    const { cargoId } = params;
    return await getCargo(cargoId).catch(handleApiError);
  },
  component: RouteComponent,
});

function RouteComponent() {
  const cargo = Route.useLoaderData();

  return (
    <Card className="w-full max-w-md" variant="transparent">
      <Card.Header className="font-medium text-lg flex flex-row items-center gap-2">
        <Pencil className="text-muted inline" />
        Editar cargo de empleado
      </Card.Header>
      <Card.Content>
        <FormCargoEmpleado cargo={cargo} />
      </Card.Content>
    </Card>
  );
}
