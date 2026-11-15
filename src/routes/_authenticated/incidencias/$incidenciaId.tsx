import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { useAuth } from "@modules/auth/store/authStore";
import { getIncidencia } from "@modules/incidencias/api/incidencias";
import { BotonEliminarIncidencia } from "@modules/incidencias/components/BotonEliminarIncidencia";
import { FormIncidencia } from "@modules/incidencias/components/FormIncidencia";
import { PanelEstadoIncidencia } from "@modules/incidencias/components/PanelEstadoIncidencia";
import { fecha } from "@modules/proyectos/types/proyectos";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/incidencias/$incidenciaId",
)({ component: DetalleIncidenciaPage });

function DetalleIncidenciaPage() {
  const { incidenciaId } = Route.useParams();
  const id = Number(incidenciaId);
  const valido = Number.isInteger(id) && id > 0;
  const { hasPermission, hasAnyPermission } = useAuth();
  const puedeVerActividad = hasAnyPermission([
    "ACTIVIDAD_READ",
    "ACTIVIDAD_CREATE",
    "ACTIVIDAD_UPDATE",
  ]);
  const puedeEditar = hasPermission("INCIDENCIA_UPDATE");

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["incidencias", "detalle", id],
    queryFn: () => getIncidencia(id),
    enabled: valido,
    retry: false,
  });

  if (!valido) return <p role="alert">Identificador inválido.</p>;
  if (isPending) return <p role="status">Cargando incidencia…</p>;
  if (isError) {
    return (
      <div role="alert">
        No se pudo cargar la incidencia.{" "}
        <Button variant="outline" onClick={() => void refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Incidencia #{data.id}</h1>
          {data.actividadDiaria && (
            <p className="text-sm text-gray-500">
              Vinculada a la actividad{" "}
              <span className="font-medium text-gray-700">
                {data.actividadDiaria.nombre}
              </span>{" "}
              del {fecha(data.actividadDiaria.fecha)}.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data.actividadDiaria && puedeVerActividad && (
            <Link
              to="/actividades-diarias/editar/$actividadId"
              params={{ actividadId: String(data.actividadDiaria.id) }}
            >
              <Button>Ir a la actividad</Button>
            </Link>
          )}
          {hasPermission("INCIDENCIA_DELETE") && (
            <BotonEliminarIncidencia incidencia={data} />
          )}
          <Link to="/incidencias">
            <Button variant="outline">Volver al listado</Button>
          </Link>
        </div>
      </div>
      <PanelEstadoIncidencia incidencia={data} puedeCambiar={puedeEditar} />
      {puedeEditar ? (
        <FormIncidencia
          key={`${data.id}-${data.updatedAt}`}
          incidencia={data}
        />
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>{data.titulo}</Card.Title>
          </Card.Header>
          <Card.Content>
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {data.descripcion}
            </p>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
