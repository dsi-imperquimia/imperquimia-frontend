import { Button } from "@heroui/react/button";
import { fecha } from "@modules/proyectos/types/proyectos";
import { useEffect, useMemo, useState } from "react";
import {
  normalizarTexto,
  type ProyectoDisponibleActividad,
} from "../types/actividad-diaria";

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

  return (
    <section aria-label="Proyectos asignados" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            1. Proyectos activos asignados
          </h2>
          <p className="text-sm text-gray-500">
            Elige en cuál de tus proyectos deseas revisar o registrar
            actividades.
            {proyectosActivos.length === 1 &&
              " Tu único proyecto activo está seleccionado por defecto."}
          </p>
        </div>

        <label className="flex w-full flex-col gap-1 text-sm sm:w-72">
          Buscar proyecto
          <input
            className="rounded-lg border border-gray-300 px-3 py-2"
            placeholder="Filtrar por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </label>
      </div>

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
            ? "No hay proyectos que coincidan con la búsqueda."
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
                {["Proyecto", "Cliente", "Fechas", "Estado", "Acción"].map(
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
                  <tr
                    key={p.id}
                    className={
                      seleccionado
                        ? "border-t border-gray-200 bg-gray-50"
                        : "border-t border-gray-200"
                    }
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">{p.nombre}</p>
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
                        {seleccionado ? "Seleccionado" : "Ver actividades"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
