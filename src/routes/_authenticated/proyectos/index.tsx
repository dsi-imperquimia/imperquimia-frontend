import { Button } from "@heroui/react/button";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { listProyectos } from "@modules/proyectos/api/listProyectos";
import { dinero, fecha } from "@modules/proyectos/types/proyectos";

export const Route = createFileRoute("/_authenticated/proyectos/")({
  component: Proyectos,
});
function Proyectos() {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const {
    data = [],
    isPending,
    isError,
    refetch,
    isFetching,
  } = useQuery({ queryKey: ["proyectos"], queryFn: listProyectos });
  const items = data.filter(
    (p) =>
      (!estado || p.estado === estado) &&
      `${p.nombre} ${p.cliente ?? ""} ${p.ubicacion ?? ""}`
        .toLocaleLowerCase()
        .includes(busqueda.trim().toLocaleLowerCase()),
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Proyectos</h1>
          <p className="text-sm text-gray-500">
            Obras, presupuesto de materiales y herramientas asignadas.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          isDisabled={isFetching}
        >
          Actualizar
        </Button>
      </div>
      <div className="flex flex-wrap gap-4 rounded-xl border border-gray-200 bg-white p-4">
        <label className="flex min-w-60 flex-1 flex-col gap-1 text-sm">
          Buscar proyecto
          <input
            className="rounded-lg border border-gray-300 p-2"
            placeholder="Nombre, cliente o ubicación"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Estado
          <select
            className="rounded-lg border border-gray-300 p-2"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="">Todos</option>
            {["ACTIVO", "FINALIZADO", "PAGADO", "GARANTIA"].map((e) => (
              <option key={e} value={e}>
                {e === "GARANTIA" ? "GARANTÍA" : e}
              </option>
            ))}
          </select>
        </label>
      </div>
      {isPending ? (
        <p role="status">Cargando proyectos…</p>
      ) : isError ? (
        <div role="alert">
          No se pudieron cargar los proyectos.{" "}
          <Button variant="outline" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          {data.length
            ? "No hay proyectos que coincidan con los filtros."
            : "Todavía no hay proyectos registrados."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Listado de proyectos</caption>
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                {[
                  "Proyecto",
                  "Cliente",
                  "Fechas",
                  "Estado",
                  "Presupuesto de materiales",
                  "Acciones",
                ].map((t) => (
                  <th key={t} className="px-4 py-3">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
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
                      {p.estado === "GARANTIA" ? "GARANTÍA" : p.estado}
                    </span>
                  </td>
                  <td className="px-4 py-4">{dinero(p.total)}</td>
                  <td className="px-4 py-4">
                    <Link
                      className="whitespace-nowrap font-medium text-blue-700 hover:underline"
                      to="/proyectos/$proyectoId"
                      params={{ proyectoId: String(p.id) }}
                    >
                      Ver proyecto
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
