import { Button } from "@heroui/react/button";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { listMisAsignaciones } from "@modules/mis-asignaciones/api/misAsignaciones";
import { fecha } from "@modules/proyectos/types/proyectos";
import { CheckCircle2, MapPin } from "lucide-react";

const ESTADO_LABEL: Record<string, string> = {
  GARANTIA: "GARANTÍA",
  EN_PAUSA: "EN PAUSA",
};

export const Route = createFileRoute("/_authenticated/mis-proyectos/")({
  component: MisProyectos,
});

function MisProyectos() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["mis-asignaciones"],
    queryFn: listMisAsignaciones,
  });

  if (isPending) return <p role="status">Cargando tus proyectos…</p>;
  if (isError)
    return (
      <div role="alert">
        No se pudieron cargar tus proyectos asignados.{" "}
        <Button variant="outline" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    );

  const { items, pendientes } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          Mis proyectos
          {pendientes > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
              {pendientes} pendiente{pendientes > 1 ? "s" : ""}
            </span>
          )}
        </h1>
        <p className="text-sm text-gray-500">
          Proyectos donde tienes una asignación vigente.
        </p>
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          No tienes proyectos asignados por el momento.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to="/mis-proyectos/$proyectoId"
                params={{ proyectoId: String(item.id) }}
                className="block h-full rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-sm"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{item.nombre}</h2>
                  {item.vista ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                      <CheckCircle2 className="size-3.5" />
                      Vista
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      Pendiente
                    </span>
                  )}
                </div>
                <p className="flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin className="size-3.5" />
                  {item.ubicacion || "Sin ubicación"}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  {ESTADO_LABEL[item.estado] ?? item.estado} ·{" "}
                  {fecha(item.fechaInicio)} – {fecha(item.fechaFin)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
