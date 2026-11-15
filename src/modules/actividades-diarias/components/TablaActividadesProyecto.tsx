import { Button } from "@heroui/react/button";
import { Chip } from "@heroui/react/chip";
import { Tooltip } from "@heroui/react/tooltip";
import { useAuth } from "@modules/auth/store/authStore";
import { fecha } from "@modules/proyectos/types/proyectos";
import { CircleHelp } from "lucide-react";
import {
  puedeEditarActividad,
  type ActividadDiaria,
} from "../types/actividad-diaria";

interface ColumnaTabla {
  id: string;
  titulo: string;
  ayuda: string;
}

const COLUMNAS_BASE: readonly ColumnaTabla[] = [
  {
    id: "fecha",
    titulo: "Fecha",
    ayuda:
      "Día calendario al que corresponde este registro de la bitácora del proyecto.",
  },
  {
    id: "actividad",
    titulo: "Actividad",
    ayuda:
      "Título o resumen breve del avance diario; inicia con un nombre automático mientras está pendiente.",
  },
  {
    id: "proyecto",
    titulo: "Proyecto",
    ayuda:
      "Proyecto activo al que pertenece esta entrada de la bitácora diaria.",
  },
  {
    id: "descripcion",
    titulo: "Descripción",
    ayuda:
      "Detalle técnico del trabajo ejecutado. Aparece como pendiente hasta que se complete el avance del día.",
  },
  {
    id: "observaciones",
    titulo: "Observaciones",
    ayuda:
      "Notas adicionales, incidencias o comentarios opcionales sobre la jornada.",
  },
  {
    id: "registradoPor",
    titulo: "Registrado por",
    ayuda:
      "Responsable que guardó el avance. Indica «Sistema (pendiente)» porque el sistema genera la entrada del día automáticamente hasta que alguien la completa.",
  },
  {
    id: "incidencias",
    titulo: "Incidencias",
    ayuda:
      "Cantidad de incidencias en obra vinculadas a esta jornada diaria.",
  },
];

function EncabezadoColumna({ titulo, ayuda }: Omit<ColumnaTabla, "id">) {
  return (
    <th className="px-4 py-3">
      <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span>{titulo}</span>
        <Tooltip delay={150} closeDelay={100}>
          <Tooltip.Trigger
            aria-label={`Ayuda sobre columna ${titulo}`}
            className="inline-flex size-4 cursor-help items-center justify-center rounded-full text-gray-400 transition-colors hover:text-gray-700 focus-visible:text-gray-700 focus-visible:outline-2 focus-visible:outline-gray-400"
          >
            <CircleHelp className="size-3.5" aria-hidden="true" />
          </Tooltip.Trigger>
          <Tooltip.Content
            placement="top"
            showArrow
            className="max-w-xs text-xs leading-relaxed"
          >
            <Tooltip.Arrow />
            <p>{ayuda}</p>
          </Tooltip.Content>
        </Tooltip>
      </div>
    </th>
  );
}

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

  const columnas: ColumnaTabla[] = [
    ...COLUMNAS_BASE,
    ...(onEvidencias
      ? [
          {
            id: "evidencias",
            titulo: "Evidencias",
            ayuda:
              "Cantidad de fotografías adjuntas para respaldar el trabajo; haz clic para ver, capturar o subir imágenes.",
          },
        ]
      : []),
    ...(onEditar
      ? [
          {
            id: "acciones",
            titulo: "Acciones",
            ayuda:
              "Permite completar una entrada pendiente («Registrar») o corregir un registro guardado («Editar») antes de 48 h (o siempre para administración).",
          },
        ]
      : []),
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Listado de actividades diarias</caption>
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            {columnas.map((col) => (
              <EncabezadoColumna
                key={col.id}
                titulo={col.titulo}
                ayuda={col.ayuda}
              />
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
                  {pendienteRegistro
                    ? "Sistema (pendiente)"
                    : (a.empleado?.nombreCompleto ??
                      (a.usuario
                        ? `${a.usuario.name} ${a.usuario.lastName}`
                        : "Sin definir"))}
                </td>
                <td className="px-4 py-4 text-gray-700">
                  {(a.incidencias?.length ?? 0) > 0 ? (
                    <Chip
                      size="sm"
                      color="warning"
                      title={a.incidencias?.map((i) => i.titulo).join(", ")}
                    >
                      {a.incidencias?.length}{" "}
                      {a.incidencias?.length === 1
                        ? "incidencia"
                        : "incidencias"}
                    </Chip>
                  ) : (
                    "Ninguna"
                  )}
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
