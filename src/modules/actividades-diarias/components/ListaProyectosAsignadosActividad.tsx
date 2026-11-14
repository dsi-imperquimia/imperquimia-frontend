import { Button } from "@heroui/react/button";
import { fecha } from "@modules/proyectos/types/proyectos";
import { useEffect, useMemo, useState } from "react";
import type { ProyectoDisponibleActividad } from "../types/actividad-diaria";

function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

export function ListaProyectosAsignadosActividad({
  proyectos,
  isPending = false,
  isError = false,
  selectedProyectoId,
  onSelectProyecto,
  onRetry,
}: {
  proyectos: ProyectoDisponibleActividad[];
  isPending?: boolean;
  isError?: boolean;
  selectedProyectoId: number | null;
  onSelectProyecto: (proyecto: ProyectoDisponibleActividad) => void;
  onRetry?: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");

  const proyectosActivos = useMemo(
    () => proyectos.filter((proyecto) => proyecto.estado === "ACTIVO"),
    [proyectos],
  );

  // CA2 (GPRCIMPER-29): Si el usuario solamente tiene un proyecto activo, debe aparecer seleccionado por defecto
  useEffect(() => {
    if (proyectosActivos.length === 1 && selectedProyectoId === null) {
      onSelectProyecto(proyectosActivos[0]);
    }
  }, [proyectosActivos, selectedProyectoId, onSelectProyecto]);

  // CA3 (GPRCIMPER-29): Búsqueda rápida por nombre de proyecto
  const items = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim());
    if (!termino) return proyectosActivos;
    return proyectosActivos.filter((proyecto) =>
      normalizarTexto(proyecto.nombre).includes(termino),
    );
  }, [busqueda, proyectosActivos]);

  const proyectoSeleccionado = proyectosActivos.find(
    (item) => item.id === selectedProyectoId,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 rounded-xl border border-gray-200 bg-white p-4">
        <label className="flex min-w-60 flex-1 flex-col gap-1 text-sm">
          Buscar proyecto
          <input
            className="rounded-lg border border-gray-300 p-2"
            placeholder="Nombre del proyecto"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </label>
      </div>

      {proyectoSeleccionado && (
        <p
          role="status"
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700"
        >
          Proyecto seleccionado:{" "}
          <span className="font-semibold text-gray-900">
            {proyectoSeleccionado.nombre}
          </span>
          {proyectosActivos.length === 1 && (
            <span className="ml-2 inline-flex whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
              Seleccionado por defecto
            </span>
          )}
        </p>
      )}

      {isPending ? (
        <p role="status">Cargando proyectos…</p>
      ) : isError ? (
        <div role="alert">
          No se pudieron cargar los proyectos.{" "}
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Reintentar
            </Button>
          )}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          {proyectosActivos.length
            ? "No hay proyectos que coincidan con los filtros."
            : "Todavía no hay proyectos activos asignados como Jefe de Proyecto."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Listado de proyectos asignados
            </caption>
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                {["Proyecto", "Cliente", "Fechas", "Estado", "Acciones"].map(
                  (t) => (
                    <th key={t} className="px-4 py-3">
                      {t}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const seleccionado = p.id === selectedProyectoId;
                return (
                  <tr key={p.id} className="border-t border-gray-200">
                    <td className="px-4 py-4">
                      <p className="font-semibold">{p.nombre}</p>
                      <p className="text-gray-500">
                        {p.ubicacion || "Sin ubicación"}
                      </p>
                    </td>
                    <td className="px-4 py-4">{p.cliente || "Sin definir"}</td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {fecha(p.fechaInicio)}
                      <br />
                      {fecha(p.fechaFin)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => onSelectProyecto(p)}
                        className={
                          seleccionado
                            ? "inline-flex whitespace-nowrap rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white"
                            : "whitespace-nowrap font-medium text-blue-700 hover:underline"
                        }
                      >
                        {seleccionado ? "Seleccionado" : "Seleccionar proyecto"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
