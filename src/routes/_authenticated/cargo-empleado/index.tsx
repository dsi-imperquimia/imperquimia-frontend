import { Spinner, toast } from "@heroui/react";
import { Button } from "@heroui/react/button";
import { Table } from "@heroui/react/table";
import { cn } from "@modules/core/utils/utils";
import { listCargos } from "@modules/cargo-empleado/api/list-cargos";
import DialogDeleteCargo from "@modules/cargo-empleado/components/DialogDeleteCargo";
import type { Cargo } from "@modules/cargo-empleado/types/cargo";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Edit, RefreshCw, UserPlus } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/cargo-empleado/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isPending, error, refetch, isRefetching } = useQuery<Cargo[]>({
    queryKey: ["cargos"],
    queryFn: listCargos,
  });

  const items = data || [];

  const handleDeleteSuccess = () => {
    refetch();
  };

  useEffect(() => {
    if (!error) return;
    toast.danger("Error al cargar los cargos. Por favor, inténtalo de nuevo.");
  }, [error]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cargos de empleado</h1>
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
          <Link to="/cargo-empleado/create">
            <Button>
              <UserPlus className="mr-1" />
              Crear cargo
            </Button>
          </Link>
        </div>
      </div>
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Cargos de empleado" className="min-w-full">
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
              <Table.Collection items={items}>
                {(cargo) => (
                  <Table.Row key={cargo.id}>
                    <Table.Cell>{cargo.nombre}</Table.Cell>
                    <Table.Cell>
                      <div className="inline-flex items-center gap-2 justify-end">
                        <Link
                          to="/cargo-empleado/$cargoId"
                          params={{ cargoId: cargo.id }}
                        >
                          <Button size="sm">
                            <Edit className="mr-1" />
                            Editar
                          </Button>
                        </Link>
                        <DialogDeleteCargo
                          cargo={cargo}
                          onDeleteSuccess={handleDeleteSuccess}
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
