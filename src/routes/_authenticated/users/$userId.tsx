import { Card } from "@heroui/react";
import { handleApiError } from "@modules/core/utils/handleApiError";
import { getUser } from "@modules/user/api/get-user";
import { FormUser } from "@modules/user/components/FormUser";
import { createFileRoute } from "@tanstack/react-router";
import { UserPen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/users/$userId")({
  params: {
    parse: ({ userId }) => ({ userId: Number(userId) }),
    stringify: ({ userId }) => ({ userId: userId.toString() }),
  },
  loader: async ({ params }) => {
    console.log("loader", params);
    const { userId } = params;
    return await getUser(userId).catch(handleApiError);
  },
  component: RouteComponent,
});

function RouteComponent() {
  const user = Route.useLoaderData();

  return (
    <Card className="w-full max-w-md" variant="transparent">
      <Card.Header className="font-medium text-lg flex flex-row items-center gap-2">
        <UserPen className="text-muted inline" />
        Crear usuario
      </Card.Header>
      <Card.Content>
        <FormUser user={user} />
      </Card.Content>
    </Card>
  );
}
