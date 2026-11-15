import { Button } from "@heroui/react/button";
import {
  listActividadesDiarias,
  listProyectosDisponiblesActividad,
} from "@modules/actividades-diarias/api/actividades-diarias";
import { BorradoresActividad } from "@modules/actividades-diarias/components/BorradoresActividad";
import { ModalResultadoActividad } from "@modules/actividades-diarias/components/ModalResultadoActividad";
import { SelectorProyectoActividad } from "@modules/actividades-diarias/components/SelectorProyectoActividad";
import { TablaActividadesProyecto } from "@modules/actividades-diarias/components/TablaActividadesProyecto";
import { useBorradoresActividad } from "@modules/actividades-diarias/hooks/useBorradoresActividad";
import { userActions } from "@modules/auth/store/authStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/actividades-diarias/")({
  component: ActividadesDiariasPage,
});

export function ActividadesDiariasPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedProyectoId, setSelectedProyectoId] = useState<number | null>(
    null,
  );

  const puedeCrear = userActions.hasPermission("ACTIVIDAD_CREATE");
  const puedeEditar = userActions.hasPermission("ACTIVIDAD_UPDATE");
  const {
    borradores,
    claveEnProceso,
    isReenviandoTodos,
    reenviar,
    descartar,
    estadoModal,
    cerrarModal,
  } = useBorradoresActividad({ autoSync: puedeCrear });

  const proyectosQuery = useQuery({
    queryKey: ["actividades-diarias", "proyectos-disponibles"],
    queryFn: listProyectosDisponiblesActividad,
  });

  const actividadesQuery = useQuery({
    queryKey: ["actividades-diarias", "lista", selectedProyectoId],
    queryFn: () => listActividadesDiarias(selectedProyectoId),
  });

  const proyectos = useMemo(
    () =>
      (proyectosQuery.data ?? []).filter((item) => item.estado === "ACTIVO"),
    [proyectosQuery.data],
  );

  const handleSelectProyecto = useCallback((proyectoId: number | null) => {
    setSelectedProyectoId(proyectoId);
  }, []);

  async function refrescarTodo() {
    await queryClient.invalidateQueries({
      queryKey: ["actividades-diarias"],
    });
  }

  const isRefreshing = proyectosQuery.isFetching || actividadesQuery.isFetching;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Actividades diarias</h1>
          <p className="text-sm text-gray-500">
            Consulta las jornadas registradas y fíltralas por proyecto asignado.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void refrescarTodo()}
          isDisabled={isRefreshing}
        >
          Actualizar
        </Button>
      </div>

      {puedeCrear && (
        <Link
          to="/actividades-diarias/create"
          className="inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
        >
          Crear actividad diaria
        </Link>
      )}

      {puedeCrear && (
        <BorradoresActividad
          borradores={borradores}
          claveEnProceso={claveEnProceso}
          isReenviandoTodos={isReenviandoTodos}
          onReenviar={reenviar}
          onDescartar={descartar}
        />
      )}

      {/* GPRCIMPER-29: Filtro de proyectos activos asignados con búsqueda integrada (sin preseleccionar para Crear) */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="min-w-60 flex-1">
          <SelectorProyectoActividad
            proyectos={proyectos}
            selectedProyectoId={selectedProyectoId}
            onSelectProyecto={handleSelectProyecto}
            autoSelectSingle={false}
            label="Filtrar por proyecto"
            placeholder="Todos los proyectos (escribe para buscar)"
            description=""
          />
        </div>
        {selectedProyectoId !== null && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setSelectedProyectoId(null)}
          >
            Ver todos
          </Button>
        )}
        {proyectosQuery.isError && (
          <p role="alert" className="text-sm text-red-700">
            No se pudieron cargar tus proyectos asignados.{" "}
            <button
              type="button"
              onClick={() => void proyectosQuery.refetch()}
              className="font-medium underline"
            >
              Reintentar
            </button>
          </p>
        )}
      </div>

      {!proyectosQuery.isPending &&
        !proyectosQuery.isError &&
        proyectos.length === 0 && (
          <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
            Todavía no tienes proyectos activos asignados como Jefe de Proyecto.
          </p>
        )}

      {/* GPRCIMPER-34: Lista única de actividades diarias */}
      <TablaActividadesProyecto
        actividades={actividadesQuery.data ?? []}
        isPending={actividadesQuery.isPending}
        isError={actividadesQuery.isError}
        onRetry={() => void actividadesQuery.refetch()}
        onEditar={
          puedeEditar
            ? (actividad) =>
                void navigate({
                  to: "/actividades-diarias/editar/$actividadId",
                  params: { actividadId: String(actividad.id) },
                })
            : undefined
        }
      />

      <ModalResultadoActividad estado={estadoModal} onClose={cerrarModal} />
    </div>
  );
}
