import { Button } from "@heroui/react/button";
import { Table } from "@heroui/react/table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getProyecto } from "@modules/proyectos/api/getProyecto";
import {
  dinero,
  fecha,
  TIPOS_OBRA_LABEL,
} from "@modules/proyectos/types/proyectos";

import { DialogCancelarProyecto } from "@modules/proyectos/components/DialogCancelarProyecto";
import { AsignarJefeProyecto } from "@modules/proyectos/components/AsignarJefeProyecto";
import { AsignarEmpleadosProyecto } from "@modules/proyectos/components/AsignarEmpleadosProyecto";
import { userActions } from "@modules/auth/store/authStore";
import { SeccionConsumosMateriales } from "@modules/consumos-materiales/components/SeccionConsumosMateriales";
import { FinalizarProyectoDialog } from "@modules/consumos-materiales/components/FinalizarProyectoDialog";
import { ArrowLeft, Ban, Pencil } from "lucide-react";

const ESTADO_LABEL: Record<string, string> = {
  GARANTIA: "GARANTÍA",
  EN_PAUSA: "EN PAUSA",
};

export const Route = createFileRoute("/_authenticated/proyectos/$proyectoId")({
  component: Detalle,
});
function Detalle() {
  const client = useQueryClient();
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
  if (isError)
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
      <Link
        to="/proyectos"
        className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline"
      >
        <ArrowLeft className="size-4" />
        Volver a proyectos
      </Link>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{p.nombre}</h1>
          {p.estado === "CANCELADO" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              <Ban className="size-3.5" />
              Cancelado
            </span>
          )}
        </div>
        <p className="mt-1 text-gray-500">
          {ESTADO_LABEL[p.estado] ?? p.estado} ·{" "}
          {p.ubicacion || "Sin ubicación"}
        </p>
      </div>
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap gap-3">
          {p.estado === "ACTIVO" &&
            userActions.hasPermission("PROYECTO_UPDATE") && (
              <Link to="/proyectos/editar/$proyectoId" params={{ proyectoId }}>
                <Button variant="outline">
                  <Pencil className="mr-1 size-4" />
                  Editar proyecto
                </Button>
              </Link>
            )}
          {p.estado === "ACTIVO" &&
            userActions.hasPermission("CONSUMO_MATERIAL_CREATE") &&
            userActions.hasPermission("PROYECTO_UPDATE") && (
              <FinalizarProyectoDialog
                proyecto={p}
                onSuccess={async () => {
                  await refetch();
                  await Promise.all([
                    client.invalidateQueries({
                      queryKey: ["consumos-materiales", p.id],
                    }),
                    client.invalidateQueries({
                      queryKey: ["inventario-materiales"],
                    }),
                    client.invalidateQueries({ queryKey: ["proyectos"] }),
                  ]);
                }}
              />
            )}
          {p.estado === "ACTIVO" &&
            userActions.hasPermission("PROYECTO_DELETE") && (
              <DialogCancelarProyecto proyecto={p} />
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
            ["Tipo de obra", p.tipoObra ? TIPOS_OBRA_LABEL[p.tipoObra] : null],
            [
              "Presupuesto",
              p.presupuesto != null ? dinero(p.presupuesto) : null,
            ],
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
        {p.estado === "CANCELADO" && p.motivoCancelacion && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <span className="font-semibold">Motivo de cancelación: </span>
            {p.motivoCancelacion}
          </p>
        )}
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
      <AsignarJefeProyecto proyecto={p} editable={p.estado !== "CANCELADO"} />
      <AsignarEmpleadosProyecto
        proyecto={p}
        editable={p.estado !== "CANCELADO"}
      />
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Materiales cotizados</h2>
        {p.detalles.length ? (
          <Table>
            <Table.ScrollContainer>
              <Table.Content
                aria-label="Materiales cotizados del proyecto"
                className="min-w-[760px]"
              >
                <Table.Header>
                  <Table.Column isRowHeader>Material</Table.Column>
                  <Table.Column>Cantidad</Table.Column>
                  <Table.Column>Unidad</Table.Column>
                  <Table.Column>Costo unitario</Table.Column>
                  <Table.Column>Subtotal</Table.Column>
                  <Table.Column>IVA</Table.Column>
                  <Table.Column>Total</Table.Column>
                </Table.Header>
                <Table.Body>
                  <Table.Collection items={p.detalles}>
                    {(d) => (
                      <Table.Row key={d.id}>
                        <Table.Cell>{d.material.nombre}</Table.Cell>
                        <Table.Cell>{Number(d.cantidad)}</Table.Cell>
                        <Table.Cell>{d.unidad}</Table.Cell>
                        <Table.Cell>{dinero(d.costoUnitario)}</Table.Cell>
                        <Table.Cell>{dinero(d.subTotal)}</Table.Cell>
                        <Table.Cell>{dinero(d.totalIva)}</Table.Cell>
                        <Table.Cell>{dinero(d.total)}</Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Collection>
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        ) : (
          <p className="text-gray-500">
            Este proyecto todavía no tiene materiales cotizados.
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
      {userActions.hasPermission("CONSUMO_MATERIAL_READ") && (
        <SeccionConsumosMateriales
          proyecto={p}
          refetchProyecto={() => refetch()}
        />
      )}
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
