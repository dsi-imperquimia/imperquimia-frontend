import { Button } from "@heroui/react/button";
import { useAuth } from "@modules/auth/store/authStore";
import { fecha } from "@modules/proyectos/types/proyectos";
import {
  puedeEditarActividad,
  type ActividadDiaria,
} from "../types/actividad-diaria";

export function TablaActividadesProyecto({
  actividades,
  isPending = false,
  isError = false,
  onRetry,
  onEditar,
}: {
  actividades: ActividadDiaria[];
  isPending?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onEditar: (actividad: ActividadDiaria) => void;
}) {
  const { user } = useAuth();
  const rolNombre = user?.role?.name;

  if (isPending) {
    return <p role="status">Cargando actividades…</p>;
  }

  if (isError) {
    return (
      <div role="alert">
        No se pudieron cargar las actividades del proyecto.{" "}
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    );
  }

  if (actividades.length === 0) {
    return (
      <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        Todavía no hay actividades diarias registradas para este proyecto.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">
          Listado de actividades diarias del proyecto
        </caption>
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            {[
              "Fecha",
              "Descripción",
              "Observaciones",
              "Registrado por",
              "Acciones",
            ].map((t) => (
              <th key={t} className="px-4 py-3">
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {actividades.map((a) => {
            const habilitado = puedeEditarActividad(a.createdAt, rolNombre);
            return (
              <tr key={a.id} className="border-t border-gray-200">
                <td className="whitespace-nowrap px-4 py-4">
                  {fecha(a.fecha)}
                </td>
                <td className="px-4 py-4">{a.descripcion}</td>
                <td className="px-4 py-4 text-gray-500">
                  {a.observaciones || "Sin observaciones"}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  {a.empleado?.nombreCompleto ??
                    (a.usuario
                      ? `${a.usuario.name} ${a.usuario.lastName}`
                      : "Sin definir")}
                </td>
                <td className="px-4 py-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    isDisabled={!habilitado}
                    onClick={() => onEditar(a)}
                  >
                    Editar
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
