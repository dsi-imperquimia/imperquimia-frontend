import { Button } from "@heroui/react/button";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getProyecto } from "@modules/proyectos/api/getProyecto";
import { dinero, fecha } from "@modules/proyectos/types/proyectos";
import { DialogDeleteProyecto } from "@modules/proyectos/components/DialogDeleteProyecto";
import { userActions } from "@modules/auth/store/authStore";

export const Route = createFileRoute("/_authenticated/proyectos/$proyectoId")({
  component: Detalle,
});
function Detalle() {
  const { proyectoId } = Route.useParams();
  const id = Number(proyectoId);
  const valido = Number.isInteger(id) && id > 0;
  const {
    data: p,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["proyectos", id],
    queryFn: () => getProyecto(id),
    enabled: valido,
    retry: false,
  });
  if (!valido) return <p role="alert">Identificador de proyecto inválido.</p>;
  if (isPending) return <p role="status">Cargando proyecto…</p>;
  if (isError || !p)
    return (
      <div role="alert">
        No se pudo cargar el proyecto. Puede que ya no esté disponible.{" "}
        <Button onClick={() => refetch()}>Reintentar</Button>
        <Link to="/proyectos" className="ml-4 text-blue-700">
          Volver a proyectos
        </Link>
      </div>
    );
  return (
    <div className="space-y-6">
      <Link to="/proyectos" className="text-sm text-blue-700 hover:underline">
        ← Volver a proyectos
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{p.nombre}</h1>
        <p className="mt-1 text-gray-500">
          {p.estado === "GARANTIA" ? "GARANTÍA" : p.estado} ·{" "}
          {p.ubicacion || "Sin ubicación"}
        </p>
      </div>
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex gap-3">
          {userActions.hasPermission("PROYECTO_UPDATE") && (
            <Link
              className="rounded-lg border border-gray-300 px-4 py-2"
              to="/proyectos/editar/$proyectoId"
              params={{ proyectoId }}
            >
              Editar proyecto
            </Link>
          )}
          {userActions.hasPermission("PROYECTO_DELETE") && (
            <DialogDeleteProyecto proyecto={p} />
          )}
        </div>
        <h2 className="mb-4 text-lg font-semibold">Información del proyecto</h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Cliente", p.cliente],
            ["Teléfono", p.phone],
            ["Correo", p.email],
            ["Fecha de inicio", fecha(p.fechaInicio)],
            ["Fecha de fin", fecha(p.fechaFin)],
            [
              "Creado por",
              p.creadoPor
                ? `${p.creadoPor.name} ${p.creadoPor.lastName}`
                : null,
            ],
          ].map(([titulo, valor]) => (
            <div key={titulo}>
              <dt className="text-sm text-gray-500">{titulo}</dt>
              <dd className="break-words">{valor || "Sin definir"}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 whitespace-pre-wrap">
          {p.descripcion || "Sin descripción"}
        </p>
        <div className="mt-4">
          {p.cotizacionId ? (
            <Link
              className="text-blue-700 hover:underline"
              to="/cotizaciones/$cotizacionId/view"
              params={{ cotizacionId: String(p.cotizacionId) }}
            >
              Ver cotización #{p.cotizacionId}
            </Link>
          ) : (
            <span className="text-sm text-gray-500">Creado sin cotización</span>
          )}
        </div>
      </section>
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">
          Presupuesto de materiales
        </h2>
        {p.detalles.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {[
                    "Material",
                    "Cantidad",
                    "Unidad",
                    "Costo unitario",
                    "Subtotal",
                    "IVA",
                    "Total",
                  ].map((t) => (
                    <th key={t} className="p-3">
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.detalles.map((d) => (
                  <tr key={d.id} className="border-t border-gray-200">
                    <td className="p-3">{d.material.nombre}</td>
                    <td className="p-3">{Number(d.cantidad)}</td>
                    <td className="p-3">{d.unidad}</td>
                    <td className="p-3">{dinero(d.costoUnitario)}</td>
                    <td className="p-3">{dinero(d.subTotal)}</td>
                    <td className="p-3">{dinero(d.totalIva)}</td>
                    <td className="p-3">{dinero(d.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">
            Este proyecto todavía no tiene materiales presupuestados.
          </p>
        )}
        <dl className="mt-5 flex flex-wrap justify-end gap-6 border-t border-gray-200 pt-4">
          {[
            ["Subtotal", p.subTotal],
            ["IVA", p.totalIva],
            ["Total", p.total],
          ].map(([label, valor]) => (
            <div key={label}>
              <dt className="text-sm text-gray-500">{label}</dt>
              <dd className="font-semibold">{dinero(valor)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Herramientas asignadas</h2>
        {p.herramientas.length ? (
          <ul className="divide-y divide-gray-200">
            {p.herramientas.map((h) => (
              <li
                key={h.id}
                className="flex flex-wrap justify-between gap-2 py-3"
              >
                <div>
                  <p className="font-medium">{h.nombre}</p>
                  <p className="text-sm text-gray-500">
                    {h.codigoUnico} · {h.estado.replaceAll("_", " ")}
                  </p>
                </div>
                <Link
                  className="text-blue-700 hover:underline"
                  to="/herramientas/$herramientaId/view"
                  params={{ herramientaId: String(h.id) }}
                >
                  Ver herramienta
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">
            No hay herramientas asignadas a este proyecto.
          </p>
        )}
      </section>
    </div>
  );
}
