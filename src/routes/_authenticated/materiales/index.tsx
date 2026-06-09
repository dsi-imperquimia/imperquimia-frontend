import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { listMateriales } from "@modules/materiales/api/list-materiales";
import { storeMaterial } from "@modules/materiales/api/store-material";
import { MaterialesSearchPanel } from "@modules/materiales/components/MaterialesSearchPanel";
import { isMaterialDisponible } from "@modules/materiales/components/materiales-utils";
import type { Material } from "@modules/materiales/types/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Pencil, Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/materiales/")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState("");
  const { data, isPending, error, refetch, isRefetching } = useQuery<
    Material[]
  >({
    queryKey: ["materiales"],
    queryFn: listMateriales,
  });

  useEffect(() => {
    if (!error) return;
    toast.danger(
      "Error al cargar los materiales. Por favor, inténtalo de nuevo.",
    );
  }, [error]);

  async function handleToggleEstado(material: Material) {
    try {
      await storeMaterial({ id: material.id, estado: !material.estado });
      toast.success(
        material.estado
          ? `"${material.nombre}" desactivado`
          : `"${material.nombre}" activado`,
      );
      queryClient.invalidateQueries({ queryKey: ["materiales"] });
    } catch {
      toast.danger("Error al cambiar el estado del material.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Lista de materiales
          </h1>
          <p className="text-sm text-gray-500">
            Busca, visualiza y gestiona el catálogo de materiales.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            isIconOnly
            onClick={() => refetch()}
            isDisabled={isPending || isRefetching}
            isPending={isRefetching}
          >
            <RefreshCw className={isRefetching ? "animate-spin" : ""} />
          </Button>
          <Link to="/materiales/gestion">
            <Button>
              <Plus className="mr-1 size-4" />
              Nuevo material
            </Button>
          </Link>
        </div>
      </div>

      <MaterialesSearchPanel
        materiales={data ?? []}
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        isPending={isPending}
        renderAction={(material) => {
          const disponible = isMaterialDisponible(material);
          return (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate({ to: "/materiales/gestion", search: { id: material.id } })}
              >
                <Pencil className="mr-1 size-3" />
                Editar
              </Button>
              <Button
                size="sm"
                variant={disponible ? "danger-soft" : "outline"}
                onClick={() => handleToggleEstado(material)}
              >
                {disponible ? "Desactivar" : "Activar"}
              </Button>
            </div>
          );
        }}
      />
    </div>
  );
}
