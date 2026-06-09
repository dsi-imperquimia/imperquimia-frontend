import {
  CheckCircle2,
  PackageSearch,
  Search,
  XCircle,
  Link,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Material } from "../types/material";
import {
  filtrarMateriales,
  getEstadoMaterialLabel,
  isMaterialDisponible,
} from "./materiales-utils";

interface Props {
  materiales: Material[];
  busqueda: string;
  onBusquedaChange: (value: string) => void;
  isPending?: boolean;
  renderAction?: (material: Material) => ReactNode;
}

export function MaterialesSearchPanel({
  materiales,
  busqueda,
  onBusquedaChange,
  isPending = false,
  renderAction,
}: Props) {
  const resultados = filtrarMateriales(materiales, busqueda);
  const hasSearch = busqueda.trim().length > 0;

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <label
          className="text-sm font-medium text-gray-700"
          htmlFor="buscar-material"
        >
          Buscar por nombre, código o descripción
        </label>
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 focus-within:border-gray-400">
          <Search className="size-4 text-gray-400" />
          <input
            id="buscar-material"
            value={busqueda}
            onChange={(event) => onBusquedaChange(event.target.value)}
            placeholder="Ej. MAT-0001, cemento, varilla..."
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Resultados
            </h2>
            <p className="text-sm text-gray-500">
              {resultados.length} material(es) encontrado(s)
            </p>
          </div>
          <PackageSearch className="size-5 text-gray-400" />
        </div>

        {isPending ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            Cargando materiales...
          </div>
        ) : resultados.length === 0 && hasSearch ? (
          <div className="px-4 py-8 text-center text-sm italic text-gray-500">
            Material no encontrado, contacte a bodega.
          </div>
        ) : resultados.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No hay materiales registrados.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {resultados.map((material) => {
              const disponible = isMaterialDisponible(material);

              return (
                <article
                  key={material.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-gray-900">
                        {material.nombre}
                      </h3>
                      {material.codigo && (
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {material.codigo}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                          disponible
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {disponible ? (
                          <CheckCircle2 className="size-3" />
                        ) : (
                          <XCircle className="size-3" />
                        )}
                        {getEstadoMaterialLabel(material.estado)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>{material.descripcion || "Sin descripción"}</span>
                      <span className="font-medium">
                        Unidad: {material.unidad}
                      </span>
                      <span className="font-medium">
                        Precio: ${Number(material.costoUnitario).toFixed(2)}
                      </span>
                    </div>
                    
                    
                    {material.fichaTecnica && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span>
                          <a
                            href={material.fichaTecnica}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Ficha técnica
                          </a>
                        </span>
                      </div>
                    )}
                  </div>

                  {renderAction && (
                    <div className="shrink-0">{renderAction(material)}</div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
