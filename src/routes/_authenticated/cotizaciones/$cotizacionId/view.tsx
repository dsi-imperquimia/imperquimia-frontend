import { handleApiError } from "@modules/core/utils/handleApiError";
import { getCotizacion } from "@modules/cotizacion/api/get-cotizacion";
import { CotizacionView } from "@modules/cotizacion/components/cotizacion-view";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/cotizaciones/$cotizacionId/view",
)({
  loader: async ({ params }) => {
    return await getCotizacion(
      Number(params.cotizacionId),
    ).catch(handleApiError);
  },

  component: RouteComponent,
});

function RouteComponent() {
  const cotizacion = Route.useLoaderData();

  return <CotizacionView cotizacion={cotizacion} />;
}