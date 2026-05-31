import { Spinner, toast } from "@heroui/react";
import { Button } from "@heroui/react/button";
import { Table } from "@heroui/react/table";
import { cn } from "@modules/core/utils/utils";
import { listUsers } from "@modules/user/api/listusers";
import DialogDeleteUser from "@modules/user/components/DialogDeleteUser";
import type { User } from "@modules/user/types/user";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Edit, RefreshCw, UserPlus } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/users/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { user: authUser } = Route.useRouteContext()?.auth ?? {};
  const { data, isPending, error, refetch, isRefetching } = useQuery<User>({
    queryKey: ["users"],
    queryFn: listUsers,
  });

  const items = (data || []) as User[];

  const handleDeleteSuccess = () => {
    refetch();
  };

  useEffect(() => {
    if (!error) return;
    toast.danger(
      "Error al cargar los usuarios. Por favor, inténtalo de nuevo.",
    );
  }, [error]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            isIconOnly
            onClick={() => refetch()}
            isDisabled={isPending || isRefetching}
            isPending={isRefetching}
          >
            <RefreshCw className={cn(isRefetching && "animate-spin")} />
          </Button>
          <Link to="/users/create">
            <Button>
              <UserPlus className="mr-1" />
              Crear usuario
            </Button>
          </Link>
        </div>
      </div>
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Usuarops" className="min-w-full">
            <Table.Header>
              <Table.Column isRowHeader>Nombre</Table.Column>
              <Table.Column>Apellido</Table.Column>
              <Table.Column>Correo electrónico</Table.Column>
              <Table.Column>Acciones</Table.Column>
            </Table.Header>
            <Table.Body>
              {isPending && (
                <Table.LoadMore isLoading={isPending}>
                  <Table.LoadMoreContent>
                    <Spinner size="sm" />
                  </Table.LoadMoreContent>
                </Table.LoadMore>
              )}
              <Table.Collection items={items}>
                {(user) => (
                  <Table.Row key={user.id}>
                    <Table.Cell>{user.name}</Table.Cell>
                    <Table.Cell>{user.lastName}</Table.Cell>
                    <Table.Cell>{user.email}</Table.Cell>
                    <Table.Cell>
                      <div className="inline-flex items-center gap-2 justify-end">
                        <Link
                          to={`/users/$userId`}
                          params={{ userId: user.id }}
                        >
                          <Button size="sm">
                            <Edit className="mr-1" />
                            Editar
                          </Button>
                        </Link>
                        {user.id !== authUser?.id && (
                          <DialogDeleteUser
                            user={user}
                            onDeleteSuccess={handleDeleteSuccess}
                          />
                        )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Collection>
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </>
  );
}
