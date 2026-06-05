import { Spinner, toast } from "@heroui/react";
import { Button } from "@heroui/react/button";
import { Table } from "@heroui/react/table";
import { cn } from "@modules/core/utils/utils";
import { listEmpleados } from "@modules/empleados/api/list-empleados";
import DialogDeleteEmpleado from "@modules/empleados/components/DialogDeleteEmpleado";
import type { Empleado } from "@modules/empleados/types/empleado";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Edit, RefreshCw, UserPlus } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/empleados/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { user: authUser } = Route.useRouteContext()?.auth ?? {};
  const { data, isPending, error, refetch, isRefetching } = useQuery<Empleado[]>({
    queryKey: ["empleados"],
    queryFn: listEmpleados,
  });

  const items = data || [];

  const handleDeleteSuccess = () => {
    refetch();
  };

  useEffect(() => {
    if (!error) return;

    toast.danger(
      "Error al cargar los empleados. Por favor, inténtalo de nuevo.",
    );
  }, [error]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Empleados</h1>
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
          <Link to="/empleados/create">
            <Button>
              <UserPlus className="mr-1" />
              Crear empleado
            </Button>
          </Link>
        </div>
      </div>
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Empleados" className="min-w-full">
            <Table.Header>
              <Table.Column isRowHeader>Nombre completo</Table.Column>
              <Table.Column>DUI</Table.Column>
              <Table.Column>NIT</Table.Column>
              <Table.Column>Cargo</Table.Column>
              <Table.Column>Activo</Table.Column>
              <Table.Column>Registro</Table.Column>
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
                {(empleado) => (
                  <Table.Row key={empleado.id}>
                    <Table.Cell>{empleado.nombreCompleto}</Table.Cell>
                    <Table.Cell>{empleado.dui}</Table.Cell>
                    <Table.Cell>{empleado.nit}</Table.Cell>
                    <Table.Cell>{empleado.cargoId}</Table.Cell>
                    <Table.Cell>{empleado.activo ? "Sí" : "No"}</Table.Cell>
                    <Table.Cell>
                      {new Date(empleado.fechaRegistro).toLocaleDateString("es-ES")}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="inline-flex items-center gap-2 justify-end">
                        <Link
                          to="/empleados/$empleadoId"
                          params={{ empleadoId: empleado.id }}
                        >
                          <Button size="sm">
                            <Edit className="mr-1" />
                            Editar
                          </Button>
                        </Link>
                        {empleado.id !== authUser?.id && (
                          <DialogDeleteEmpleado
                            empleado={empleado}
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
