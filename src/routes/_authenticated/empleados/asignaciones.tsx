import { Spinner, toast } from "@heroui/react";
import { Button } from "@heroui/react/button";
import { Table } from "@heroui/react/table";
import { cn } from "@modules/core/utils/utils";
import { listAsignacionesEmpleados } from "@modules/empleados/api/list-asignaciones";
import type { AsignacionEmpleado } from "@modules/empleados/types/asignacion";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase,
  CheckCircle2,
  Crown,
  FolderKanban,
  RefreshCw,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/empleados/asignaciones")({
  component: RouteComponent,
});

const ESTADO_PROYECTO_CLASES: Record<string, string> = {
  ACTIVO: "bg-green-100 text-green-700",
  FINALIZADO: "bg-gray-100 text-gray-500",
  PAGADO: "bg-emerald-100 text-emerald-700",
  GARANTIA: "bg-amber-100 text-amber-700",
  CANCELADO: "bg-red-100 text-red-700",
};

function claseCantidad(cantidad: number) {
  if (cantidad === 0) return "bg-gray-100 text-gray-500";
  if (cantidad === 1) return "bg-green-100 text-green-700";
  return "bg-amber-100 text-amber-700";
}

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
              <Table.Column>Cantidad de proyectos asignados</Table.Column>
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
                      {asignacion.proyectos.length > 0 ? (
                        <div className="flex flex-col gap-1.5 py-1.5">
                          {asignacion.proyectos.map((proyecto) => (
                            <div
                              key={proyecto.id}
                              className="flex flex-wrap items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50/60 px-2.5 py-1.5"
                            >
                              <Link
                                to="/proyectos/$proyectoId"
                                params={{ proyectoId: String(proyecto.id) }}
                                className="flex items-center gap-1.5 font-medium text-gray-800 hover:text-blue-700 hover:underline"
                              >
                                <FolderKanban className="size-4 shrink-0 text-gray-400" />
                                {proyecto.nombre}
                              </Link>
                              {proyecto.roles.map((rol) => (
                                <span
                                  key={rol}
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                                    rol === "JEFE"
                                      ? "bg-violet-100 text-violet-700"
                                      : "bg-sky-100 text-sky-700",
                                  )}
                                >
                                  {rol === "JEFE" ? (
                                    <Crown className="size-3.5" />
                                  ) : (
                                    <Wrench className="size-3.5" />
                                  )}
                                  {rol === "JEFE"
                                    ? "Jefe de proyecto"
                                    : "Técnico"}
                                </span>
                              ))}
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                                  ESTADO_PROYECTO_CLASES[proyecto.estado] ??
                                    "bg-gray-100 text-gray-500",
                                )}
                              >
                                <span className="size-1.5 rounded-full bg-current" />
                                {proyecto.estado === "GARANTIA"
                                  ? "GARANTÍA"
                                  : proyecto.estado}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Sin proyecto asignado
                        </span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                          claseCantidad(asignacion.cargaHoraria),
                        )}
                      >
                        <Briefcase className="size-3.5" />
                        {asignacion.cargaHoraria > 0
                          ? asignacion.cargaHoraria
                          : "Sin proyectos asignados"}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      {asignacion.sobreasignado ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                          <TriangleAlert className="size-3.5" />
                          Sobreasignado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                          <CheckCircle2 className="size-3.5" />
                          Normal
                        </span>
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
