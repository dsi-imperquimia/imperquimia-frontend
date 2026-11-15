import { Button } from "@heroui/react/button";
import { getActividadDiaria } from "@modules/actividades-diarias/api/actividades-diarias";
import { FormActividadDiaria } from "@modules/actividades-diarias/components/FormActividadDiaria";
import { PanelEvidenciasActividad } from "@modules/actividades-diarias/components/PanelEvidenciasActividad";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/actividades-diarias/editar/$actividadId",
)({
  component: EditarActividadDiariaPage,
});

function EditarActividadDiariaPage() {
  const { actividadId } = Route.useParams();
  const id = Number(actividadId);
  const valido = Number.isInteger(id) && id > 0;

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["actividades-diarias", "detalle", id],
    queryFn: () => getActividadDiaria(id),
    enabled: valido,
    retry: false,
  });

  if (!valido) return <p role="alert">Identificador inválido.</p>;
  if (isPending) return <p role="status">Cargando actividad diaria…</p>;
  if (isError) {
    return (
      <div role="alert">
        No se pudo cargar el registro de actividad diaria.{" "}
        <Button variant="outline" onClick={() => void refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">
        Editar registro de actividad diaria
      </h1>
      <FormActividadDiaria key={data.id} actividad={data} />
      <PanelEvidenciasActividad
        actividadId={data.id}
        actividadNombre={data.nombre}
        evidenciasIniciales={data.evidencias}
        soloLectura={data.proyecto?.estado !== "ACTIVO"}
      />
    </div>
  );
}
