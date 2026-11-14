import { Button } from "@heroui/react/button";
import { listProyectosDisponiblesActividad } from "@modules/actividades-diarias/api/actividades-diarias";
import { ListaProyectosAsignadosActividad } from "@modules/actividades-diarias/components/ListaProyectosAsignadosActividad";
import type { ProyectoDisponibleActividad } from "@modules/actividades-diarias/types/actividad-diaria";
import { userActions } from "@modules/auth/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";

export const Route = createFileRoute("/_authenticated/actividades-diarias/")({
  component: ActividadesDiariasPage,
});

export function ActividadesDiariasPage() {
  const [selectedProyectoId, setSelectedProyectoId] = useState<number | null>(
    null,
  );

  const {
    data: proyectos = [],
    isPending,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["actividades-diarias", "proyectos-disponibles"],
    queryFn: listProyectosDisponiblesActividad,
  });

  const handleSelectProyecto = useCallback(
    (proyecto: ProyectoDisponibleActividad) => {
      setSelectedProyectoId(proyecto.id);
    },
    [],
  );

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
          onClick={() => void refetch()}
          isDisabled={isFetching}
        >
          Actualizar
        </Button>
      </div>

      {userActions.hasPermission("ACTIVIDAD_CREATE") && (
        <Link
          to="/actividades-diarias/create"
          search={
            selectedProyectoId ? { proyectoId: selectedProyectoId } : undefined
          }
          className="inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
        >
          Crear actividad diaria
        </Link>
      )}

      {/* HU GPRCIMPER-29: Ver lista de los proyectos asignados */}
      <ListaProyectosAsignadosActividad
        proyectos={proyectos}
        isPending={isPending}
        isError={isError}
        selectedProyectoId={selectedProyectoId}
        onSelectProyecto={handleSelectProyecto}
        onRetry={() => void refetch()}
      />
    </div>
  );
}
