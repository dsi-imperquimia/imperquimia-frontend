import { handleApiError } from "@modules/core/utils/handleApiError";
import { getHerramienta } from "@modules/herramientas/api/getHerramienta";
import { HerramientaView } from "@modules/herramientas/components/herramienta-view";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/herramientas/$herramientaId/view",
)({
  loader: async ({ params }) => {
    return await getHerramienta(Number(params.herramientaId)).catch(handleApiError);
  },

  component: RouteComponent,
});

function RouteComponent() {
  const herramienta = Route.useLoaderData();
  return <HerramientaView herramienta={herramienta} />;
}
