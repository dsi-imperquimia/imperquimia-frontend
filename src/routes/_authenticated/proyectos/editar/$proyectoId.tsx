import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FormProyecto } from "@modules/proyectos/components/FormProyecto";
import { getProyecto } from "@modules/proyectos/api/getProyecto";
export const Route = createFileRoute(
  "/_authenticated/proyectos/editar/$proyectoId",
)({ component: Editar });
function Editar() {
  const { proyectoId } = Route.useParams();
  const id = Number(proyectoId);
  const valido = Number.isInteger(id) && id > 0;
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["proyectos", id],
    queryFn: () => getProyecto(id),
    enabled: valido,
    retry: false,
  });
  if (!valido) return <p role="alert">Identificador inválido.</p>;
  if (isPending) return <p role="status">Cargando proyecto…</p>;
  if (isError || !data)
    return (
      <div role="alert">
        No se pudo cargar el proyecto.{" "}
        <button onClick={() => refetch()}>Reintentar</button>
      </div>
    );
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Editar proyecto</h1>
      <FormProyecto key={data.id} proyecto={data} />
    </div>
  );
}
