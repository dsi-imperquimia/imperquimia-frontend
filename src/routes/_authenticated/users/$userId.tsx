import { Card } from "@heroui/react";
import { handleApiError } from "@modules/core/utils/handleApiError";
import { getUser } from "@modules/user/api/get-user";
import { getAllRoles } from "@modules/user/api/roles/get-all";
import { FormUser } from "@modules/user/components/FormUser";
import { createFileRoute } from "@tanstack/react-router";
import { UserPen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/users/$userId")({
  params: {
    parse: ({ userId }) => ({ userId: Number(userId) }),
    stringify: ({ userId }) => ({ userId: userId.toString() }),
  },
  loader: async ({ params }) => {
    const { userId } = params;
    return {
      user: await getUser(userId).catch(handleApiError),
      roles: await getAllRoles().catch(handleApiError),
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { user, roles } = Route.useLoaderData();

  return (
    <Card className="w-full max-w-md" variant="transparent">
      <Card.Header className="font-medium text-lg flex flex-row items-center gap-2">
        <UserPen className="text-muted inline" />
        Editar usuario
      </Card.Header>
      <Card.Content>
        <FormUser user={user} roles={roles} />
      </Card.Content>
    </Card>
  );
}
