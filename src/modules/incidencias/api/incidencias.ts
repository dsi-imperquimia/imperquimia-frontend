import { http } from "@lib/http";
import type { ProyectoDisponibleActividad } from "@modules/actividades-diarias/types/actividad-diaria";
import { isAxiosError } from "axios";
import type {
  ActualizarIncidencia,
  ErroresIncidencia,
  EstadoIncidencia,
  FiltroIncidencias,
  Incidencia,
  RegistrarIncidencia,
} from "../types/incidencia";

export async function listProyectosDisponiblesIncidencia() {
  const { data } = await http.get<ProyectoDisponibleActividad[]>(
    "/incidencias/proyectos-disponibles",
  );
  return data;
}

export function construirParamsIncidencias(
  filtros: FiltroIncidencias = {},
): URLSearchParams {
  const params = new URLSearchParams();
  if (filtros.proyectoId) params.set("proyectoId", String(filtros.proyectoId));
  if (filtros.estado) params.set("estado", filtros.estado);
  if (filtros.prioridad) params.set("prioridad", filtros.prioridad);
  if (filtros.actividadDiariaId) {
    params.set("actividadDiariaId", String(filtros.actividadDiariaId));
  }
  return params;
}

export async function listIncidencias(filtros: FiltroIncidencias = {}) {
  const query = construirParamsIncidencias(filtros).toString();
  const { data } = await http.get<Incidencia[]>(
    `/incidencias${query ? `?${query}` : ""}`,
  );
  return data;
}

export async function getIncidencia(id: number) {
  const { data } = await http.get<Incidencia>(`/incidencias/${id}`);
  return data;
}

export async function registrarIncidencia(payload: RegistrarIncidencia) {
  const { data } = await http.post<{
    incidencia: Incidencia;
    repetido: boolean;
  }>("/incidencias", payload);
  return data;
}

export async function eliminarIncidencia(id: number) {
  const { data } = await http.delete<{ id: number }>(`/incidencias/${id}`);
  return data;
}

export async function actualizarIncidencia(
  id: number,
  payload: ActualizarIncidencia,
) {
  const { data } = await http.patch<Incidencia>(`/incidencias/${id}`, payload);
  return data;
}

export async function cambiarEstadoIncidencia(
  id: number,
  estado: EstadoIncidencia,
  comentario?: string,
) {
  const { data } = await http.patch<Incidencia>(`/incidencias/${id}/estado`, {
    estado,
    comentario: comentario?.trim() || undefined,
  });
  return data;
}

export async function listIncidenciasDeJornada(actividadId: number) {
  const { data } = await http.get<Incidencia[]>(
    `/actividades-diarias/${actividadId}/incidencias`,
  );
  return data;
}

/** GPRCIMPER-142: deja exactamente estas incidencias vinculadas a la jornada. */
export async function vincularIncidenciasAJornada(
  actividadId: number,
  incidenciaIds: number[],
) {
  const { data } = await http.put<Incidencia[]>(
    `/actividades-diarias/${actividadId}/incidencias`,
    { incidenciaIds },
  );
  return data;
}

export function errorIncidencia(error: unknown): ErroresIncidencia {
  const mensaje: unknown = isAxiosError(error)
    ? error.response?.data?.message
    : null;
  const campos: ErroresIncidencia["campos"] = {};

  if (mensaje && typeof mensaje === "object" && !Array.isArray(mensaje)) {
    const errores = mensaje as Record<string, unknown>;
    for (const campo of [
      "proyectoId",
      "titulo",
      "descripcion",
      "fecha",
      "prioridad",
      "actividadDiariaId",
    ] as const) {
      const valor = errores[campo];
      if (Array.isArray(valor) && typeof valor[0] === "string") {
        campos[campo] = valor[0];
      } else if (typeof valor === "string") {
        campos[campo] = valor;
      }
    }
    if (Object.keys(campos).length > 0) {
      return { campos, general: Object.values(campos)[0] };
    }
  }
  if (typeof mensaje === "string") return { campos, general: mensaje };
  if (Array.isArray(mensaje) && typeof mensaje[0] === "string") {
    return { campos, general: mensaje[0] };
  }
  return {
    campos,
    general: "No se pudo completar la operación. Inténtalo de nuevo.",
  };
}
