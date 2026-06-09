import { Spinner, toast } from "@heroui/react";
import { Button } from "@heroui/react/button";
import { Table } from "@heroui/react/table";
import { cn } from "@modules/core/utils/utils";
import { getAllRoles } from "@modules/user/api/roles/get-all";
import DialogDeleteRole from "@modules/user/components/role/DialogDeleteRole";
import type { Role } from "@modules/user/types/roles";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Edit, RefreshCw, UserPlus } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/users/roles/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isPending, error, refetch, isRefetching } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: getAllRoles,
  });
  useEffect(() => {
    if (!error) return;
    toast.danger("Error al cargar los roles. Por favor, inténtalo de nuevo.");
  }, [error]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Roles</h1>
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
          <Link to="/users/roles/create">
            <Button>
              <UserPlus className="mr-1" />
              Crear role
            </Button>
          </Link>
        </div>
      </div>
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Usuarops" className="min-w-full">
            <Table.Header>
              <Table.Column isRowHeader>Nombre</Table.Column>
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
              <Table.Collection items={data}>
                {(role) => (
                  <Table.Row key={role.id}>
                    <Table.Cell>{role.name}</Table.Cell>
                    <Table.Cell>
                      <div className="inline-flex items-center gap-2 justify-end">
                        <Link
                          to={`/users/roles/$roleId`}
                          params={{ roleId: role.id }}
                        >
                          <Button size="sm">
                            <Edit className="mr-1" />
                            Editar
                          </Button>
                        </Link>
                        <DialogDeleteRole
                          role={role}
                          onDeleteSuccess={refetch}
                        />
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
