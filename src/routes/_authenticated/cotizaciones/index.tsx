import { Spinner, toast, Select, ListBox } from "@heroui/react";
import { Button } from "@heroui/react/button";
import { Table } from "@heroui/react/table";
import { userActions } from "@modules/auth/store/authStore";
import { cn } from "@modules/core/utils/utils";
import { listCotizaciones } from "@modules/cotizacion/api/list-cotizaciones";
import type {
  CotizacionList,
  EstadoCotizacion,
} from "@modules/cotizacion/types/cotizacion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Edit, Eye, FilePlus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { deleteCotizacion } from "@modules/cotizacion/api/delete-cotizacion";
import { approveCotizacion } from "@modules/cotizacion/api/approve-cotizacion";

export const Route = createFileRoute("/_authenticated/cotizaciones/")({
  component: RouteComponent,
});

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-SV");
}

function confirmarAccion(mensaje: string) {
  return window.confirm(mensaje);
}

function RouteComponent() {
  const queryClient = useQueryClient();
  const { data, isPending, error, refetch, isRefetching } = useQuery<
    CotizacionList[]
  >({
    queryKey: ["cotizaciones"],
    queryFn: listCotizaciones,
  });

  const approveMutation = useMutation({
    mutationFn: approveCotizacion,

    onSuccess: async () => {
      toast.success("Cotización aprobada correctamente.");

      await queryClient.invalidateQueries({
        queryKey: ["cotizaciones"],
      });
    },

    onError: () => {
      toast.danger("No se pudo aprobar la cotización.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCotizacion,

    onSuccess: async () => {
      toast.success("Cotización eliminada correctamente.");

      await queryClient.invalidateQueries({
        queryKey: ["cotizaciones"],
      });
    },

    onError: () => {
      toast.danger("No se pudo eliminar la cotización.");
    },
  });

  const items = data || [];

  useEffect(() => {
    if (!error) return;

    toast.danger(
      "Error al cargar las cotizaciones. Por favor, inténtalo de nuevo.",
    );
  }, [error]);

  async function handleEstadoChange(id: number, estado: EstadoCotizacion) {
    if (estado === "PENDIENTE") return;

    if (estado === "APROBADA") {
      const confirmado = confirmarAccion(
        "¿Está seguro de aprobar esta cotización? Al aprobarla se creará automáticamente un proyecto.",
      );

      if (!confirmado) return;

      approveMutation.mutate(id);
      return;
    }

    if (estado === "RECHAZADA") {
      const confirmado = confirmarAccion(
        "¿Está seguro de rechazar esta cotización? Ya no aparecerá en el listado principal.",
      );

      if (!confirmado) return;

      deleteMutation.mutate(id);
    }
  }

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
          {userActions.hasPermission("COTIZACIONES_CREATE") && (
            <Link to="/cotizaciones/create">
              <Button>
                <FilePlus className="mr-1" />
                Crear cotización
              </Button>
            </Link>
          )}
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
                      {cotizacion.estado === "PENDIENTE" ? (
                        <Select
                          value={cotizacion.estado}
                          onChange={(value) =>
                            handleEstadoChange(
                              cotizacion.id,
                              value as EstadoCotizacion,
                            )
                          }
                          variant="secondary"
                          isDisabled={
                            approveMutation.isPending ||
                            deleteMutation.isPending
                          }
                        >
                          <Select.Trigger className="w-36">
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>

                          <Select.Popover>
                            <ListBox>
                              <ListBox.Item
                                id="PENDIENTE"
                                textValue="Pendiente"
                              >
                                Pendiente
                              </ListBox.Item>

                              <ListBox.Item id="APROBADA" textValue="Aprobada">
                                Aprobada
                              </ListBox.Item>

                              <ListBox.Item
                                id="RECHAZADA"
                                textValue="Rechazada"
                              >
                                Rechazada
                              </ListBox.Item>
                            </ListBox>
                          </Select.Popover>
                        </Select>
                      ) : (
                        <span
                          className={cn(
                            "rounded-full px-2 py-1 text-xs font-medium",
                            cotizacion.estado === "APROBADA" &&
                              "bg-green-100 text-green-700",
                            cotizacion.estado === "RECHAZADA" &&
                              "bg-red-100 text-red-700",
                          )}
                        >
                          {cotizacion.estado === "APROBADA"
                            ? "Aprobada"
                            : "Rechazada"}
                        </span>
                      )}
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

                        {userActions.hasPermission("COTIZACIONES_UPDATE") &&
                          cotizacion.estado === "PENDIENTE" && (
                            <Link
                              to="/cotizaciones/$cotizacionId/edit"
                              params={{
                                cotizacionId: cotizacion.id.toString(),
                              }}
                            >
                              <Button size="sm">
                                <Edit className="mr-1" />
                                Editar
                              </Button>
                            </Link>
                          )}

                        {cotizacion.estado === "PENDIENTE" && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              const confirmado = confirmarAccion(
                                "¿Está seguro de eliminar esta cotización? Esta acción la marcará como rechazada.",
                              );

                              if (!confirmado) return;

                              deleteMutation.mutate(cotizacion.id);
                            }}
                            isDisabled={deleteMutation.isPending}
                            isPending={deleteMutation.isPending}
                          >
                            <Trash2 className="mr-1" />
                            Eliminar
                          </Button>
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
