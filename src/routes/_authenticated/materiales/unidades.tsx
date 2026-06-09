import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { listMateriales } from "@modules/materiales/api/list-materiales";
import { MaterialesSearchPanel } from "@modules/materiales/components/MaterialesSearchPanel";
import {
  getEstadoMaterialLabel,
  getUnidadMaterial,
} from "@modules/materiales/components/materiales-utils";
import type { Material } from "@modules/materiales/types/material";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Ruler, SearchCheck } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/materiales/unidades")({
  component: RouteComponent,
});

function RouteComponent() {
  const [busqueda, setBusqueda] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState("1");
  const {
    data = [],
    isPending,
    error,
  } = useQuery<Material[]>({
    queryKey: ["materiales"],
    queryFn: listMateriales,
  });

  const selected = data.find((material) => material.id === selectedId);

  useEffect(() => {
    if (!error) return;
    toast.danger(
      "Error al cargar los materiales. Por favor, inténtalo de nuevo.",
    );
  }, [error]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Ver unidades de medición
        </h1>
        <p className="text-sm text-gray-500">
          Selecciona un material y registra la cantidad con su unidad fija.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <MaterialesSearchPanel
          materiales={data}
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          isPending={isPending}
          renderAction={(material) => (
            <Button
              size="sm"
              variant={selectedId === material.id ? "primary" : "outline"}
              onClick={() => setSelectedId(material.id)}
            >
              <SearchCheck className="mr-1 size-4" />
              Seleccionar
            </Button>
          )}
        />

        <aside className="h-fit rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Ruler className="size-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Unidad asignada</h2>
          </div>

          {selected ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selected.nombre}
                </p>
                <p className="text-sm text-gray-500">
                  {getEstadoMaterialLabel(selected.estado)} · $
                  {Number(selected.costoUnitario).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  {selected.descripcion || "Sin descripción"}
                </p>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-2">
                <label className="space-y-1">
                  <span className="text-sm font-medium text-gray-700">
                    Cantidad
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(event) => setCantidad(event.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-gray-700">
                    Unidad
                  </span>
                  <input
                    value={getUnidadMaterial(selected)}
                    readOnly
                    className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-700 outline-none"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 px-3 py-4 text-sm text-gray-500">
              Selecciona un material para ver la unidad junto al campo de
              cantidad.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
