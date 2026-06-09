import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { listMateriales } from "@modules/materiales/api/list-materiales";
import { MaterialesSearchPanel } from "@modules/materiales/components/MaterialesSearchPanel";
import type { Material } from "@modules/materiales/types/material";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, RefreshCw, Ruler } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/materiales/")({
  component: RouteComponent,
});

function RouteComponent() {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Buscar materiales
          </h1>
          <p className="text-sm text-gray-500">
            Encuentra materiales por nombre para reportar su uso.
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
          <Link to="/materiales/unidades">
            <Button variant="outline">
              <Ruler className="mr-1 size-4" />
              Unidades
            </Button>
          </Link>
          <Link to="/materiales/reportes">
            <Button>
              <ClipboardList className="mr-1 size-4" />
              Agregar a reporte
            </Button>
          </Link>
        </div>
      </div>

      <MaterialesSearchPanel
        materiales={data ?? []}
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        isPending={isPending}
      />
    </div>
  );
}
