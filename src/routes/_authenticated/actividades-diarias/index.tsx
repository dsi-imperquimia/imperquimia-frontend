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
            Selecciona uno de tus proyectos activos asignados como Jefe de
            Proyecto para trabajar.
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
        <>
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

          <BorradoresActividad
            borradores={borradores}
            claveEnProceso={claveEnProceso}
            isReenviandoTodos={isReenviandoTodos}
            onReenviar={reenviar}
            onDescartar={descartar}
          />
        </>
      )}

      {/* HU GPRCIMPER-29: Ver lista de los proyectos asignados */}
      <ListaProyectosAsignadosActividad
        proyectos={proyectos}
        isPending={proyectosQuery.isPending}
        isError={proyectosQuery.isError}
        selectedProyectoId={selectedProyectoId}
        onSelectProyecto={handleSelectProyecto}
        onRetry={() => void proyectosQuery.refetch()}
      />

      {/* HU GPRCIMPER-34: Registros guardados del proyecto seleccionado con botón Editar (< 48h o Administración) */}
      {proyectoActual && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            Registros de actividad diaria · {proyectoActual.nombre}
          </h2>
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
        </div>
      )}

      <ModalResultadoActividad estado={estadoModal} onClose={cerrarModal} />
    </div>
  );
}
