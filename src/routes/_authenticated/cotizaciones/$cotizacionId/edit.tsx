import { Card } from "@heroui/react";
import { handleApiError } from "@modules/core/utils/handleApiError";
import { getCotizacion } from "@modules/cotizacion/api/get-cotizacion";
import { FormCotizacion } from "@modules/cotizacion/components/cotizacion-form";
import { createFileRoute } from "@tanstack/react-router";
import { FilePenLine } from "lucide-react";

export const Route = createFileRoute(
  "/_authenticated/cotizaciones/$cotizacionId/edit",
)({
  loader: async ({ params }) => {
    return await getCotizacion(Number(params.cotizacionId)).catch(handleApiError);
  },

  component: RouteComponent,
});

function RouteComponent() {
  const cotizacion = Route.useLoaderData();

  return (
    <Card className="w-full" variant="transparent">
      <Card.Header className="font-medium text-lg flex flex-row items-center gap-2">
        <FilePenLine className="text-muted inline" />
        Editar cotización
      </Card.Header>

      <Card.Content>
        <FormCotizacion cotizacion={cotizacion} />
      </Card.Content>
    </Card>
  );
}