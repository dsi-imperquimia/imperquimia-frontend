import { Button } from "@heroui/react/button";
import {
  listActividadesDiarias,
  listProyectosDisponiblesActividad,
} from "@modules/actividades-diarias/api/actividades-diarias";
import { BorradoresActividad } from "@modules/actividades-diarias/components/BorradoresActividad";
import { ListaProyectosAsignadosActividad } from "@modules/actividades-diarias/components/ListaProyectosAsignadosActividad";
import { ModalResultadoActividad } from "@modules/actividades-diarias/components/ModalResultadoActividad";
import { TablaActividadesProyecto } from "@modules/actividades-diarias/components/TablaActividadesProyecto";
import { useBorradoresActividad } from "@modules/actividades-diarias/hooks/useBorradoresActividad";
import type { ProyectoDisponibleActividad } from "@modules/actividades-diarias/types/actividad-diaria";
import { userActions } from "@modules/auth/store/authStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";

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
    queryFn: () => listActividadesDiarias(selectedProyectoId!),
    enabled: selectedProyectoId !== null,
  });

  const proyectos = proyectosQuery.data ?? [];
  const proyectoActual = proyectos.find(
    (item) => item.id === selectedProyectoId,
  );

  const handleSelectProyecto = useCallback(
    (proyecto: ProyectoDisponibleActividad) => {
      setSelectedProyectoId(proyecto.id);
    },
    [],
  );

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
            Elige un proyecto asignado para consultar sus actividades o
            registrar una nueva jornada.
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
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/actividades-diarias/create"
            search={
              selectedProyectoId
                ? { proyectoId: selectedProyectoId }
                : undefined
            }
            className="inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
          >
            Crear actividad diaria
          </Link>
          {proyectoActual && (
            <span className="text-sm text-gray-500">
              Proyecto activo:{" "}
              <strong className="font-medium text-gray-800">
                {proyectoActual.nombre}
              </strong>
            </span>
          )}
        </div>
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

      {/* Paso 1 (GPRCIMPER-29): Ver lista de proyectos activos asignados */}
      <ListaProyectosAsignadosActividad
        proyectos={proyectos}
        isPending={proyectosQuery.isPending}
        isError={proyectosQuery.isError}
        selectedProyectoId={selectedProyectoId}
        onSelectProyecto={handleSelectProyecto}
        onRetry={() => void proyectosQuery.refetch()}
      />

      {/* Paso 2 (GPRCIMPER-34): Registros guardados del proyecto seleccionado */}
      <section aria-label="Actividades del proyecto" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              2. Actividades registradas
              {proyectoActual ? ` · ${proyectoActual.nombre}` : ""}
            </h2>
            {proyectoActual && (
              <p className="text-sm text-gray-500">
                {proyectoActual.cliente || "Sin cliente"} ·{" "}
                {proyectoActual.ubicacion || "Sin ubicación"}
              </p>
            )}
          </div>
        </div>

        {proyectoActual ? (
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
        ) : (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            Selecciona un proyecto en el paso 1 para ver y editar sus
            actividades diarias registradas.
          </p>
        )}
      </section>

      <ModalResultadoActividad estado={estadoModal} onClose={cerrarModal} />
    </div>
  );
}
