import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { listMateriales } from "@modules/materiales/api/list-materiales";
import { MaterialesSearchPanel } from "@modules/materiales/components/MaterialesSearchPanel";
import {
  MAX_MATERIALES_REPORTE,
  getUnidadMaterial,
  isMaterialDisponible,
} from "@modules/materiales/components/materiales-utils";
import type { Material } from "@modules/materiales/types/material";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface ReporteItem {
  material: Material;
  cantidad: string;
}

export const Route = createFileRoute("/_authenticated/materiales/reportes")({
  component: RouteComponent,
});

function RouteComponent() {
  const [busqueda, setBusqueda] = useState("");
  const [items, setItems] = useState<ReporteItem[]>([]);
  const {
    data = [],
    isPending,
    error,
  } = useQuery<Material[]>({
    queryKey: ["materiales"],
    queryFn: listMateriales,
  });

  const selectedIds = useMemo(
    () => new Set(items.map((item) => item.material.id)),
    [items],
  );

  useEffect(() => {
    if (!error) return;
    toast.danger(
      "Error al cargar los materiales. Por favor, inténtalo de nuevo.",
    );
  }, [error]);

  function addMaterial(material: Material) {
    if (selectedIds.has(material.id)) {
      toast.danger("El material ya está agregado al reporte.");
      return;
    }

    if (items.length >= MAX_MATERIALES_REPORTE) {
      toast.danger(
        `El reporte admite un máximo de ${MAX_MATERIALES_REPORTE} materiales.`,
      );
      return;
    }

    setItems((current) => [...current, { material, cantidad: "1" }]);
  }

  function updateCantidad(materialId: number, cantidad: string) {
    setItems((current) =>
      current.map((item) =>
        item.material.id === materialId ? { ...item, cantidad } : item,
      ),
    );
  }

  function removeMaterial(materialId: number) {
    setItems((current) =>
      current.filter((item) => item.material.id !== materialId),
    );
  }

  function submitReporte() {
    const hasInvalidQuantity = items.some(
      (item) =>
        Number(item.cantidad) <= 0 || Number.isNaN(Number(item.cantidad)),
    );

    if (items.length === 0) {
      toast.danger("Agrega al menos un material al reporte.");
      return;
    }

    if (hasInvalidQuantity) {
      toast.danger("Todos los materiales deben tener una cantidad válida.");
      return;
    }

    toast.success("Materiales agregados al reporte correctamente.");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Agregar material
          </h1>
          <p className="text-sm text-gray-500">
            Agrega varios materiales.
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700">
          {items.length}/{MAX_MATERIALES_REPORTE} materiales
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
        <MaterialesSearchPanel
          materiales={data}
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          isPending={isPending}
          renderAction={(material) => {
            const isSelected = selectedIds.has(material.id);
            const canAdd = isMaterialDisponible(material) && !isSelected;

            return (
              <Button
                size="sm"
                variant={isSelected ? "outline" : "primary"}
                isDisabled={!canAdd}
                onClick={() => addMaterial(material)}
              >
                <Plus className="mr-1 size-4" />
                {isSelected ? "Agregado" : "Agregar"}
              </Button>
            );
          }}
        />
      </div>
    </div>
  );
}
