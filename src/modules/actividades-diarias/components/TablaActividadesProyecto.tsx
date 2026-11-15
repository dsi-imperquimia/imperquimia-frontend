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
  onEvidencias,
}: {
  actividades: ActividadDiaria[];
  isPending?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onEditar?: (actividad: ActividadDiaria) => void;
  onEvidencias?: (actividad: ActividadDiaria) => void;
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

  const columnas = [
    "Fecha",
    "Actividad",
    "Proyecto",
    "Descripción",
    "Observaciones",
    "Registrado por",
    ...(onEvidencias ? ["Evidencias"] : []),
    ...(onEditar ? ["Acciones"] : []),
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Listado de actividades diarias</caption>
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            {columnas.map((t) => (
              <th key={t} className="px-4 py-3">
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {actividades.map((a) => {
            const pendienteRegistro = !a.descripcion?.trim();
            const habilitado =
              pendienteRegistro || puedeEditarActividad(a.createdAt, rolNombre);
            const filaEditable = Boolean(onEditar && habilitado);
            return (
              <tr
                key={a.id}
                onClick={filaEditable ? () => onEditar?.(a) : undefined}
                className={
                  filaEditable
                    ? "cursor-pointer border-t border-gray-200 transition-colors hover:bg-gray-50"
                    : "border-t border-gray-200"
                }
              >
                <td className="whitespace-nowrap px-4 py-4">
                  {fecha(a.fecha)}
                </td>
                <td className="px-4 py-4 font-medium text-gray-900">
                  {a.nombre}
                </td>
                <td className="px-4 py-4 text-gray-700">
                  {a.proyecto?.nombre ?? `Proyecto #${a.proyectoId}`}
                </td>
                <td className="px-4 py-4">
                  {pendienteRegistro ? (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      Pendiente de registrar (generada por el sistema)
                    </span>
                  ) : (
                    a.descripcion
                  )}
                </td>
                <td className="px-4 py-4 text-gray-500">
                  {a.observaciones || "Sin observaciones"}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  {a.empleado?.nombreCompleto ??
                    (a.usuario
                      ? `${a.usuario.name} ${a.usuario.lastName}`
                      : "Sin definir")}
                </td>
                {onEvidencias && (
                  <td className="px-4 py-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEvidencias(a);
                      }}
                    >
                      Evidencias ({a.evidencias?.length ?? 0})
                    </Button>
                  </td>
                )}
                {onEditar && (
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-start gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        isDisabled={!habilitado}
                        onClick={(event) => {
                          event.stopPropagation();
                          onEditar(a);
                        }}
                      >
                        {pendienteRegistro ? "Registrar" : "Editar"}
                      </Button>
                      {!habilitado && (
                        <span className="text-xs text-gray-500">
                          Plazo &gt; 48 h (solo admin)
                        </span>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
