import { Spinner, toast } from "@heroui/react";
import { Button } from "@heroui/react/button";
import { Table } from "@heroui/react/table";
import { cn } from "@modules/core/utils/utils";
import { listHabilidades } from "@modules/empleados/api/habilidadesApi";
import type { Habilidad } from "@modules/empleados/types/habilidad";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Edit, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/empleados/habilidades")({
  component: HabilidadesCatalogoPage,
});

function HabilidadesCatalogoPage() {
      const { data, isPending, error, refetch, isRefetching } = useQuery<Habilidad[]>({
      queryKey: ["empleados"],
      queryFn: listHabilidades,
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
                Crear empleado
              </Button>
            </Link>
          </div>
        </div>
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="habilidades" className="min-w-full">
              <Table.Header>
                <Table.Column isRowHeader>Nombre </Table.Column>
                <Table.Column>Descripcion</Table.Column>
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
                  {(habilidad) => (
                    <Table.Row key={habilidad.id}>
                      <Table.Cell>{habilidad.nombre}</Table.Cell>
                      <Table.Cell>{habilidad.descripcion}</Table.Cell>
                      <Table.Cell>
                        <div className="inline-flex items-center gap-2 justify-end">
                          <Link
                            to="/empleados/habilidades/$habilidadId"
                            params={{ habilidadId: habilidades.id }}
                          >
                            <Button size="sm">
                              <Edit className="mr-1" />
                              Editar
                            </Button>
                          </Link>
                          {/* {empleado.id !== authUser?.id && (
                            <DialogDeleteEmpleado
                              empleado={empleado}
                              onDeleteSuccess={handleDeleteSuccess}
                            />
                          )} */}
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