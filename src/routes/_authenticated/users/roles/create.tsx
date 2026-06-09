import { Card } from "@heroui/react/card";
import { handleApiError } from "@modules/core/utils/handleApiError";
import { getAllPermissions } from "@modules/user/api/permission/get-all";
import { FormRole } from "@modules/user/components/role/FormRole";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldUser } from "lucide-react";

export const Route = createFileRoute("/_authenticated/users/roles/create")({
  component: RouteComponent,
  loader: async () => ({
    permissions: await getAllPermissions().catch(handleApiError),
  }),
});

function RouteComponent() {
  const { permissions } = Route.useLoaderData();

  return (
    <Card className="w-full max-w-md" variant="transparent">
      <Card.Header className="font-medium text-lg flex flex-row items-center gap-2">
        <ShieldUser className="text-muted inline" />
        Crear role
      </Card.Header>
      <Card.Content>
        <FormRole permissions={permissions} />
      </Card.Content>
    </Card>
  );
}
