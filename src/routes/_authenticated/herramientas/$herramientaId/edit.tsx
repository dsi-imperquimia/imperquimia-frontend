import { handleApiError } from "@modules/core/utils/handleApiError";
import { getHerramienta } from "@modules/herramientas/api/getHerramienta";
import { FormHerramientaEdit } from "@modules/herramientas/components/FormHerramientaEdit";
import { Card } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { FilePenLine } from "lucide-react";

export const Route = createFileRoute(
  "/_authenticated/herramientas/$herramientaId/edit",
)({
  loader: async ({ params }) => {
    return await getHerramienta(Number(params.herramientaId)).catch(handleApiError);
  },

  component: RouteComponent,
});

function RouteComponent() {
  const herramienta = Route.useLoaderData();

  return (
    <Card className="w-full" variant="transparent">
      <Card.Header className="font-medium text-lg flex flex-row items-center gap-2">
        <FilePenLine className="text-muted inline" />
        Editar herramienta
      </Card.Header>

      <Card.Content>
        <FormHerramientaEdit herramienta={herramienta} />
      </Card.Content>
    </Card>
  );
}
