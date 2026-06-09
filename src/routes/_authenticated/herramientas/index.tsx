import { ListBox, Select, Spinner, toast } from "@heroui/react";
import { Button } from "@heroui/react/button";
import { Table } from "@heroui/react/table";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Edit, Eye, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { userActions } from "@modules/auth/store/authStore";
import { cn } from "@modules/core/utils/utils";
import { listHerramientas } from "@modules/herramientas/api/list-herramientas";
import { DialogCreateHerramienta } from "@modules/herramientas/components/DialogRegistrarHerramienta";
import type { Herramienta } from "@modules/herramientas/types/herramientas";
import { EstadoHerramienta } from "@modules/herramientas/types/herramientas";
import DialogMovimientoHerramienta from "@modules/movimientosHerramientas/components/DialogMovimientoHerramienta";
import { listProyectos } from "@modules/proyectos/api/listProyectos";

export const Route = createFileRoute("/_authenticated/herramientas/")({
  component: RouteComponent,
});

// Helper para formatear las etiquetas con la ortografía correcta (Ñ) y sus símbolos correspondientes
const getEstadoLabelWithIcon = (estado: EstadoHerramienta | "ACTIVOS") => {
  const map: Record<
    EstadoHerramienta | "ACTIVOS",
    { texto: string; icono: string }
  > = {
    ACTIVOS: { texto: "VER TODOS", icono: "✨" },
    [EstadoHerramienta.DISPONIBLE]: { texto: "DISPONIBLE", icono: "🟢" },
    [EstadoHerramienta.EN_PROYECTO]: { texto: "EN PROYECTO", icono: "🚧" },
    [EstadoHerramienta.MANTENIMIENTO]: { texto: "MANTENIMIENTO", icono: "🔧" },
    [EstadoHerramienta.DANADA]: { texto: "DAÑADA", icono: "🚨" },
    [EstadoHerramienta.DESECHO]: { texto: "DESECHO", icono: "🗑️" },
  };

  const item = map[estado];
  return `${item.icono} ${item.texto}`;
};

function RouteComponent() {
  // REQUERIMIENTO: Estado inicial en "ACTIVOS" para ver todos los operativos excepto desecho
  const [filtroEstado, setFiltroEstado] = useState<
    EstadoHerramienta | "ACTIVOS"
  >("ACTIVOS");
  const [filtroProyectoId, setFiltroProyectoId] = useState<number | undefined>(
    undefined,
  );

  // Query para cargar las herramientas mapeando los filtros dinámicos
  const {
    data: herramientas,
    isPending,
    error,
    refetch,
    isRefetching,
  } = useQuery<Herramienta[]>({
    queryKey: [
      "herramientas",
      { estado: filtroEstado, proyectoId: filtroProyectoId },
    ],
    queryFn: () => {
      const estadoApi = filtroEstado === "ACTIVOS" ? undefined : filtroEstado;
      const proyectoApi =
        filtroEstado === EstadoHerramienta.EN_PROYECTO
          ? filtroProyectoId
          : undefined;

      return listHerramientas({ estado: estadoApi, proyectoId: proyectoApi });
    },
  });

  const { data: proyectos = [] } = useQuery({
    queryKey: ["proyectos-filter"],
    queryFn: listProyectos,
  });

  // REQUERIMIENTO: Filtrado preventivo local para asegurar que la opción "ACTIVOS" barra los desechos
  const items = (herramientas || []).filter((h) => {
    if (filtroEstado === "ACTIVOS") {
      return h.estado !== EstadoHerramienta.DESECHO;
    }
    return true;
  });

  const handleMovementSuccess = () => {
    refetch();
  };

  useEffect(() => {
    if (!error) return;
    toast.danger(
      "Error al cargar el inventario de herramientas. Inténtalo de nuevo.",
    );
  }, [error]);

  const getEstadoBadge = (estado: EstadoHerramienta) => {
    const styles: Record<EstadoHerramienta, string> = {
      [EstadoHerramienta.DISPONIBLE]:
        "bg-emerald-50 text-emerald-700 border-emerald-200",
      [EstadoHerramienta.EN_PROYECTO]:
        "bg-blue-50 text-blue-700 border-blue-200",
      [EstadoHerramienta.MANTENIMIENTO]:
        "bg-amber-50 text-amber-700 border-amber-200",
      [EstadoHerramienta.DANADA]: "bg-rose-50 text-rose-700 border-rose-200",
      [EstadoHerramienta.DESECHO]: "bg-gray-100 text-gray-600 border-gray-300",
    };

    // Mapeo para forzar la visualización de la Ñ correcta en la celda de la tabla
    const textoVisual =
      estado === EstadoHerramienta.DANADA ? "DAÑADA" : estado.replace("_", " ");

    return (
      <span
        className={cn(
          "px-2.5 py-0.5 text-xs font-semibold rounded-full border",
          styles[estado],
        )}
      >
        {textoVisual}
      </span>
    );
  };

  return (
    <>
      {/* Encabezado Principal */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Control de Inventario</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Custodia de activos fijos e historial operativo.
          </p>
        </div>
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
          {userActions.hasPermission("HERRAMIENTA_CREATE") && (
            <DialogCreateHerramienta onSuccess={() => refetch()} />
          )}
        </div>
      </div>

      {/* Contenedor de Filtros */}
      <div className="flex flex-wrap gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4 items-center mb-6">
        <div className="flex flex-col gap-1 min-w-[200px]">
          <span className="text-xs font-semibold text-gray-600">
            Filtrar por Estado
          </span>
          <Select
            selectedKey={filtroEstado}
            placeholder="Todos los estados"
            variant="secondary"
            onSelectionChange={(val) => {
              if (!val) return;
              const nuevoEstado = val as EstadoHerramienta | "ACTIVOS";
              setFiltroEstado(nuevoEstado);
              if (nuevoEstado !== EstadoHerramienta.EN_PROYECTO) {
                setFiltroProyectoId(undefined);
              }
            }}
          >
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {/* REQUERIMIENTO: Opción explícita formateada con íconos para excluir desecho */}
                <ListBox.Item
                  key="ACTIVOS"
                  id="ACTIVOS"
                  textValue="Ver todos (Excepto Desecho)"
                >
                  {getEstadoLabelWithIcon("ACTIVOS")}
                </ListBox.Item>
                {Object.values(EstadoHerramienta).map((estado) => (
                  <ListBox.Item key={estado} id={estado} textValue={estado}>
                    {getEstadoLabelWithIcon(estado)}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        {/* REQUERIMIENTO: Mostrar filtro de Proyecto SOLO cuando se selecciona EN_PROYECTO */}
        {filtroEstado === EstadoHerramienta.EN_PROYECTO && (
          <div className="flex flex-col gap-1 min-w-[250px]">
            {/* REQUERIMIENTO: Texto cambiado de 'Frente de Obra' a 'Proyecto' */}
            <span className="text-xs font-semibold text-gray-600">
              Filtrar por Proyecto
            </span>
            <Select
              // CORRECCIÓN: Parseamos el id numérico a string usando selectedKey (singular) para que HeroUI lo pinte seleccionado
              selectedKey={
                filtroProyectoId !== undefined ? String(filtroProyectoId) : ""
              }
              placeholder="Todos los proyectos"
              variant="secondary"
              onSelectionChange={(val) =>
                setFiltroProyectoId(
                  val === "" || !val ? undefined : Number(val),
                )
              }
            >
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {proyectos.map((p) => (
                    // CORRECCIÓN: El ID del Item se fuerza a string en sintonía con el select
                    <ListBox.Item
                      key={p.id}
                      id={String(p.id)}
                      textValue={p.nombre}
                    >
                      🚧 {p.nombre}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
        )}
      </div>

      {/* Tabla Oficial de Inventario */}
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Herramientas" className="min-w-full">
            <Table.Header>
              <Table.Column isRowHeader>Código Único</Table.Column>
              <Table.Column>Nombre de la Herramienta</Table.Column>
              <Table.Column>Marca</Table.Column>
              <Table.Column>Tipo</Table.Column>
              <Table.Column>Estado</Table.Column>
              <Table.Column>Ubicación Actual</Table.Column>
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
                {(herramienta) => (
                  <Table.Row key={herramienta.id}>
                    <Table.Cell className="font-mono font-bold text-gray-950">
                      {herramienta.codigoUnico}
                    </Table.Cell>
                    <Table.Cell className="font-medium">
                      {herramienta.nombre}
                    </Table.Cell>
                    <Table.Cell>{herramienta.marca}</Table.Cell>
                    <Table.Cell className="text-gray-500">
                      {herramienta.tipo}
                    </Table.Cell>
                    <Table.Cell>
                      {getEstadoBadge(herramienta.estado)}
                    </Table.Cell>
                    <Table.Cell>
                      {herramienta.proyecto ? (
                        <span className="text-blue-700 font-semibold">
                          🚧 {herramienta.proyecto.nombre}
                        </span>
                      ) : (
                        <span className="text-gray-500">🏠 Bodega General</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="inline-flex items-center gap-2 justify-end">
                        <Link
                          to="/herramientas/$herramientaId/view"
                          params={{ herramientaId: herramienta.id.toString() }}
                        >
                          <Button size="sm" variant="outline">
                            <Eye className="mr-1 size-3.5" />
                            Ver
                          </Button>
                        </Link>

                        {userActions.hasPermission("HERRAMIENTA_UPDATE") && (
                          <Link
                            to="/herramientas/$herramientaId/edit"
                            params={{
                              herramientaId: herramienta.id.toString(),
                            }}
                          >
                            <Button size="sm" variant="outline">
                              <Edit className="mr-1 size-3.5" />
                              Editar
                            </Button>
                          </Link>
                        )}

                        {herramienta.estado !== EstadoHerramienta.DESECHO ? (
                          <DialogMovimientoHerramienta
                            herramienta={herramienta}
                            onMovementSuccess={handleMovementSuccess}
                          />
                        ) : (
                          <span className="text-xs text-gray-400 italic px-3">
                            De baja
                          </span>
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
