import { Spinner, toast, Select, ListBox } from "@heroui/react";
import { Button } from "@heroui/react/button";
import { Table } from "@heroui/react/table";
import { userActions } from "@modules/auth/store/authStore";
import { cn } from "@modules/core/utils/utils";
import { ConfirmActionDialog } from "@components/ConfirmActionDialog";
import { listCotizaciones } from "@modules/cotizacion/api/list-cotizaciones";
import type {
  CotizacionList,
  EstadoCotizacion,
} from "@modules/cotizacion/types/cotizacion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Edit, Eye, FilePlus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { deleteCotizacion } from "@modules/cotizacion/api/delete-cotizacion";
import { approveCotizacion } from "@modules/cotizacion/api/approve-cotizacion";

export const Route = createFileRoute("/_authenticated/cotizaciones/")({
  component: RouteComponent,
});

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-SV");
}

type PendingAction = {
  id: number;
  cliente: string;
  type: "approve" | "reject" | "delete";
};

function RouteComponent() {
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
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
    mutationFn: ({ id }: { id: number; type: "reject" | "delete" }) =>
      deleteCotizacion(id),

    onSuccess: async (_result, action) => {
      toast.success(
        action.type === "reject"
          ? "Cotización rechazada correctamente."
          : "Cotización eliminada correctamente.",
      );

      await queryClient.invalidateQueries({
        queryKey: ["cotizaciones"],
      });
    },

    onError: (_error, action) => {
      toast.danger(
        action.type === "reject"
          ? "No se pudo rechazar la cotización."
          : "No se pudo eliminar la cotización.",
      );
    },
  });

  const items = data || [];

  useEffect(() => {
    if (!error) return;

    toast.danger(
      "Error al cargar las cotizaciones. Por favor, inténtalo de nuevo.",
    );
  }, [error]);

  function handleEstadoChange(
    id: number,
    cliente: string,
    estado: EstadoCotizacion,
  ) {
    if (estado === "PENDIENTE") return;

    if (estado === "APROBADA") {
      setPendingAction({ id, cliente, type: "approve" });
      return;
    }

    setPendingAction({ id, cliente, type: "reject" });
  }

  async function confirmPendingAction() {
    if (!pendingAction) return false;

    try {
      if (pendingAction.type === "approve") {
        await approveMutation.mutateAsync(pendingAction.id);
      } else {
        await deleteMutation.mutateAsync({
          id: pendingAction.id,
          type: pendingAction.type,
        });
      }
      return true;
    } catch {
      return false;
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
                              cotizacion.cliente,
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
                            onClick={() =>
                              setPendingAction({
                                id: cotizacion.id,
                                cliente: cotizacion.cliente,
                                type: "delete",
                              })
                            }
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
      <ConfirmActionDialog
        isOpen={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        title={
          pendingAction?.type === "approve"
            ? "Aprobar cotización"
            : pendingAction?.type === "reject"
              ? "Rechazar cotización"
              : "Eliminar cotización"
        }
        description={
          pendingAction?.type === "approve"
            ? `¿Está seguro de aprobar la cotización de ${pendingAction.cliente}? Al aprobarla se creará automáticamente un proyecto.`
            : pendingAction?.type === "reject"
              ? `¿Está seguro de rechazar la cotización de ${pendingAction.cliente}? Ya no aparecerá en el listado principal.`
              : `¿Está seguro de eliminar la cotización de ${pendingAction?.cliente ?? ""}? Esta acción la marcará como rechazada.`
        }
        confirmLabel={
          pendingAction?.type === "approve"
            ? "Aprobar"
            : pendingAction?.type === "reject"
              ? "Rechazar"
              : "Eliminar"
        }
        status={pendingAction?.type === "approve" ? "warning" : "danger"}
        onConfirm={confirmPendingAction}
      />
    </>
  );
}
