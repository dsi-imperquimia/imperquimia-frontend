import { Spinner, toast } from "@heroui/react";
import { Button } from "@heroui/react/button";
import { Table } from "@heroui/react/table";
import { cn } from "@modules/core/utils/utils";
import { listCotizaciones } from "@modules/cotizacion/api/list-cotizaciones";
import type { CotizacionList } from "@modules/cotizacion/types/cotizacion";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Edit, Eye, FilePlus, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/cotizaciones/")({
  component: RouteComponent,
});

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-SV");
}

function RouteComponent() {
  const { data, isPending, error, refetch, isRefetching } = useQuery<
    CotizacionList[]
  >({
    queryKey: ["cotizaciones"],
    queryFn: listCotizaciones,
  });

  const items = data || [];

  useEffect(() => {
    if (!error) return;

    toast.danger(
      "Error al cargar las cotizaciones. Por favor, inténtalo de nuevo.",
    );
  }, [error]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cotizaciones</h1>

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

          <Link to="/cotizaciones/create">
            <Button>
              <FilePlus className="mr-1" />
              Crear cotización
            </Button>
          </Link>
        </div>
      </div>

      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Cotizaciones" className="min-w-full">
            <Table.Header>
              <Table.Column isRowHeader>Cliente</Table.Column>
              <Table.Column>Descripción</Table.Column>
              <Table.Column>Creada por</Table.Column>
              <Table.Column>Estado</Table.Column>
              <Table.Column>Creación</Table.Column>
              <Table.Column>Actualización</Table.Column>
              <Table.Column>Total</Table.Column>
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
                {(cotizacion) => (
                  <Table.Row key={cotizacion.id}>
                    <Table.Cell>{cotizacion.cliente}</Table.Cell>

                    <Table.Cell>{cotizacion.descripcion}</Table.Cell>

                    <Table.Cell>
                      {cotizacion.user?.lastName ?? "N/A"}
                    </Table.Cell>

                    <Table.Cell>
                      {cotizacion.estado === "ACTIVA"
                        ? "Activa"
                        : "Desactivada"}
                    </Table.Cell>

                    <Table.Cell>{formatDate(cotizacion.createdAt)}</Table.Cell>

                    <Table.Cell>{formatDate(cotizacion.updatedAt)}</Table.Cell>

                    <Table.Cell>
                      ${Number(cotizacion.total).toFixed(2)}
                    </Table.Cell>

                    <Table.Cell>
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to="/cotizaciones/$cotizacionId/view"
                          params={{ cotizacionId: cotizacion.id.toString() }}
                        >
                          <Button size="sm" variant="outline">
                            <Eye className="mr-1" />
                            Ver
                          </Button>
                        </Link>

                        <Link
                          to="/cotizaciones/$cotizacionId/edit"
                          params={{ cotizacionId: cotizacion.id.toString() }}
                        >
                          <Button size="sm">
                            <Edit className="mr-1" />
                            Editar
                          </Button>
                        </Link>
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