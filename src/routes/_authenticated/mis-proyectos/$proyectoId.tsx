import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Chip } from "@heroui/react/chip";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  getMiAsignacion,
  mapaUrl,
  marcarAsignacionVista,
} from "@modules/mis-asignaciones/api/misAsignaciones";
import type { PrioridadAsignacion } from "@modules/mis-asignaciones/types/asignacion";
import { fecha, TIPOS_OBRA_LABEL } from "@modules/proyectos/types/proyectos";
import { Mail, MapPin, Users } from "lucide-react";

const ESTADO_LABEL: Record<string, string> = {
  GARANTIA: "GARANTÍA",
  EN_PAUSA: "EN PAUSA",
};

const PRIORIDAD_LABEL: Record<PrioridadAsignacion, string> = {
  ALTA: "Prioridad alta",
  MEDIA: "Prioridad media",
  BAJA: "Prioridad baja",
};

const PRIORIDAD_COLOR: Record<
  PrioridadAsignacion,
  "danger" | "warning" | "default"
> = {
  ALTA: "danger",
  MEDIA: "warning",
  BAJA: "default",
};

export const Route = createFileRoute("/_authenticated/mis-proyectos/$proyectoId")({
  component: MiProyectoDetalle,
});

function MiProyectoDetalle() {
  const { proyectoId } = Route.useParams();
  const id = Number(proyectoId);
  const valido = Number.isInteger(id) && id > 0;
  const client = useQueryClient();
  const {
    data: p,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["mis-asignaciones", id],
    queryFn: () => getMiAsignacion(id),
    enabled: valido,
    retry: false,
  });

  useEffect(() => {
    if (!p || p.vista) return;
    marcarAsignacionVista(p.id).then(() => {
      client.invalidateQueries({ queryKey: ["mis-asignaciones"] });
    });
  }, [p, client]);

  if (!valido) return <p role="alert">Identificador de proyecto inválido.</p>;
  if (isPending) return <p role="status">Cargando proyecto…</p>;
  if (isError)
    return (
      <div role="alert">
        No se pudo cargar el proyecto. Puede que ya no esté asignado a ti.{" "}
        <Button onClick={() => refetch()}>Reintentar</Button>
        <Link to="/mis-proyectos" className="ml-4 text-blue-700">
          Volver a mis proyectos
        </Link>
      </div>
    );

  return (
    <div className="space-y-6">
      <Link to="/mis-proyectos" className="text-sm text-blue-700 hover:underline">
        ← Volver a mis proyectos
      </Link>
      <div>
        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold">
          {p.nombre}
          <Chip color={PRIORIDAD_COLOR[p.prioridad]} size="sm">
            {PRIORIDAD_LABEL[p.prioridad]}
          </Chip>
          {p.esJefe && (
            <Chip color="accent" size="sm">
              Jefe de proyecto
            </Chip>
          )}
        </h1>
        <p className="mt-1 text-gray-500">
          {ESTADO_LABEL[p.estado] ?? p.estado} · {fecha(p.fechaInicio)} –{" "}
          {fecha(p.fechaFin)}
          {p.cliente && <> · {p.cliente}</>}
          {p.tipoObra && <> · {TIPOS_OBRA_LABEL[p.tipoObra]}</>}
        </p>
      </div>
      <Card>
        <Card.Header>
          <Card.Title>Ubicación</Card.Title>
        </Card.Header>
        <Card.Content className="gap-4">
          {p.ubicacion ? (
            <a
              href={mapaUrl(p.ubicacion)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-blue-700 hover:underline"
            >
              <MapPin className="size-4" />
              {p.ubicacion} — ver en el mapa
            </a>
          ) : (
            <p className="text-gray-500">Este proyecto no tiene ubicación registrada.</p>
          )}
          {p.descripcion && <p className="whitespace-pre-wrap">{p.descripcion}</p>}
        </Card.Content>
      </Card>
      <Card>
        <Card.Header>
          <Card.Title>Jefe de proyecto</Card.Title>
        </Card.Header>
        <Card.Content>
          {p.jefeProyecto ? (
            <div>
              <p className="font-medium">{p.jefeProyecto.nombreCompleto}</p>
              {p.jefeProyecto.email ? (
                <a
                  href={`mailto:${p.jefeProyecto.email}`}
                  className="mt-1 flex items-center gap-2 text-blue-700 hover:underline"
                >
                  <Mail className="size-4" />
                  {p.jefeProyecto.email}
                </a>
              ) : (
                <p className="mt-1 text-sm text-gray-500">
                  Sin correo de contacto registrado.
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">
              Este proyecto todavía no tiene un jefe de proyecto asignado.
            </p>
          )}
        </Card.Content>
      </Card>
      <Card>
        <Card.Header>
          <Card.Title>Equipo asignado</Card.Title>
        </Card.Header>
        <Card.Content>
          {p.equipo.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {p.equipo.map((miembro, index) => (
                <li
                  key={`${miembro.nombreCompleto}-${index}`}
                  className="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
                >
                  <Users className="size-4 text-gray-400" />
                  <div>
                    <p className="font-medium">{miembro.nombreCompleto}</p>
                    {miembro.cargo && (
                      <p className="text-sm text-gray-500">{miembro.cargo}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No hay más gente asignada a esta obra por ahora.</p>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
