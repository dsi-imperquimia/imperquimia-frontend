import { Spinner, toast } from "@heroui/react";
import { Button } from "@heroui/react/button";
import { Table } from "@heroui/react/table";
import { cn } from "@modules/core/utils/utils";
import { listAsignacionesEmpleados } from "@modules/empleados/api/list-asignaciones";
import type { AsignacionEmpleado } from "@modules/empleados/types/asignacion";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/empleados/asignaciones")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isPending, error, refetch, isRefetching } = useQuery<
    AsignacionEmpleado[]
  >({
    queryKey: ["empleados", "asignaciones"],
    queryFn: listAsignacionesEmpleados,
  });

  const items = data || [];

  useEffect(() => {
    if (!error) return;

    toast.danger(
      "Error al cargar las asignaciones. Por favor, inténtalo de nuevo.",
    );
  }, [error]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Asignaciones por empleado</h1>
          <p className="text-sm text-gray-500">
            Carga actual de cada empleado para evitar sobrecarga de trabajo.
          </p>
        </div>
        <Button
          variant="outline"
          isIconOnly
          onClick={() => refetch()}
          isDisabled={isPending || isRefetching}
          isPending={isRefetching}
        >
          <RefreshCw className={cn(isRefetching && "animate-spin")} />
        </Button>
      </div>
      <Table>
        <Table.ScrollContainer>
          <Table.Content
            aria-label="Asignaciones por empleado"
            className="min-w-full"
          >
            <Table.Header>
              <Table.Column isRowHeader>Empleado</Table.Column>
              <Table.Column>Cargo</Table.Column>
              <Table.Column>Proyecto(s) asignado(s)</Table.Column>
              <Table.Column>Carga horaria</Table.Column>
              <Table.Column>Estado</Table.Column>
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
                {(asignacion) => (
                  <Table.Row
                    key={asignacion.empleadoId}
                    className={cn(asignacion.sobreasignado && "bg-danger-50")}
                  >
                    <Table.Cell>{asignacion.nombreCompleto}</Table.Cell>
                    <Table.Cell>{asignacion.cargo ?? "-"}</Table.Cell>
                    <Table.Cell>
                      {asignacion.proyectos.length > 0
                        ? asignacion.proyectos
                            .map((proyecto) => proyecto.nombre)
                            .join(", ")
                        : "Sin proyecto asignado"}
                    </Table.Cell>
                    <Table.Cell>{asignacion.cargaHoraria}</Table.Cell>
                    <Table.Cell>
                      {asignacion.sobreasignado ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-danger-100 px-2 py-1 text-xs font-medium text-danger-700">
                          <TriangleAlert className="size-3.5" />
                          Sobreasignado
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Normal</span>
                      )}
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
