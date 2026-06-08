import { Card } from "@heroui/react/card";
import { handleApiError } from "@modules/core/utils/handleApiError";
import { getAllRoles } from "@modules/user/api/roles/get-all";
import { FormUser } from "@modules/user/components/FormUser";
import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/users/create")({
  component: RouteComponent,
  loader: async () => ({
    roles: await getAllRoles().catch(handleApiError),
  }),
});

function RouteComponent() {
  const { roles } = Route.useLoaderData();

  return (
    <Card className="w-full max-w-md" variant="transparent">
      <Card.Header className="font-medium text-lg flex flex-row items-center gap-2">
        <UserPlus className="text-muted inline" />
        Crear usuario
      </Card.Header>
      <Card.Content>
        <FormUser roles={roles} />
      </Card.Content>
    </Card>
  );
}
