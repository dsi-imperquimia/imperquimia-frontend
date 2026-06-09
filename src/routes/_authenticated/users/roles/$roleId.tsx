import { Card } from "@heroui/react/card";
import { handleApiError } from "@modules/core/utils/handleApiError";
import { getAllPermissions } from "@modules/user/api/permission/get-all";
import { getRole } from "@modules/user/api/roles/get-role";
import { FormRole } from "@modules/user/components/role/FormRole";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldUser } from "lucide-react";

export const Route = createFileRoute("/_authenticated/users/roles/$roleId")({
  params: {
    parse: ({ roleId }) => ({ roleId: Number(roleId) }),
    stringify: ({ roleId }) => ({ roleId: roleId.toString() }),
  },
  loader: async ({ params }) => {
    const { roleId } = params;
    return {
      role: await getRole(roleId).catch(handleApiError),
      permissions: await getAllPermissions().catch(handleApiError),
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { role, permissions } = Route.useLoaderData();

  return (
    <Card className="w-full max-w-md" variant="transparent">
      <Card.Header className="font-medium text-lg flex flex-row items-center gap-2">
        <ShieldUser className="text-muted inline" />
        Editar role
      </Card.Header>
      <Card.Content>
        <FormRole role={role} permissions={permissions} />
      </Card.Content>
    </Card>
  );
}
