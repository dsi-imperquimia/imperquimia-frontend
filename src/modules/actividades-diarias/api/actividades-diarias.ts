import { http } from "@lib/http";
import { isAxiosError } from "axios";
import {
  fechaHoyIso,
  type ActividadDiaria,
  type ActualizarActividadDiaria,
  type ErroresActividadDiaria,
  type EvidenciaActividadDiaria,
  type ProyectoDisponibleActividad,
  type RegistrarActividadDiaria,
} from "../types/actividad-diaria";

const CODIGOS_ESTADO_TRANSITORIOS = new Set([502, 503, 504]);

export async function listProyectosDisponiblesActividad() {
  const { data } = await http.get<ProyectoDisponibleActividad[]>(
    "/actividades-diarias/proyectos-disponibles",
  );
  return data;
}

export interface FiltroActividadesQuery {
  proyectoId?: number | null;
  fechaInicio?: string;
  fechaFin?: string;
}

function construirParamsActividades(
  filtros?: FiltroActividadesQuery | number | null,
): URLSearchParams {
  const normalizado: FiltroActividadesQuery =
    typeof filtros === "number" || filtros === null
      ? { proyectoId: filtros }
      : (filtros ?? {});
  const params = new URLSearchParams();
  if (normalizado.proyectoId) {
    params.set("proyectoId", String(normalizado.proyectoId));
  }
  if (normalizado.fechaInicio?.trim()) {
    params.set("fechaInicio", normalizado.fechaInicio.trim());
  }
  if (normalizado.fechaFin?.trim()) {
    params.set("fechaFin", normalizado.fechaFin.trim());
  }
  return params;
}

export async function listActividadesDiarias(
  filtros?: FiltroActividadesQuery | number | null,
) {
  const query = construirParamsActividades(filtros).toString();
  const { data } = await http.get<ActividadDiaria[]>(
    `/actividades-diarias${query ? `?${query}` : ""}`,
  );
  return data;
}

function extraerNombreArchivoDisposition(
  disposition: unknown,
  fallback: string,
): string {
  if (typeof disposition !== "string") return fallback;
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  return match?.[1]?.trim() || fallback;
}

export async function exportarActividadesDiarias(
  formato: "pdf" | "excel",
  filtros?: FiltroActividadesQuery,
): Promise<{ blob: Blob; filename: string }> {
  const params = construirParamsActividades(filtros);
  params.set("formato", formato);

  try {
    const response = await http.get<Blob>(
      `/actividades-diarias/exportar?${params.toString()}`,
      { responseType: "blob" },
    );
    const ext = formato === "excel" ? "xlsx" : "pdf";
    const sufijo =
      filtros?.fechaInicio && filtros?.fechaFin
        ? `${filtros.fechaInicio}_a_${filtros.fechaFin}`
        : filtros?.fechaInicio
          ? `desde_${filtros.fechaInicio}`
          : filtros?.fechaFin
            ? `hasta_${filtros.fechaFin}`
            : fechaHoyIso();
    const fallback = `actividades-diarias-${sufijo}.${ext}`;
    const disposition = (
      response.headers as Record<string, unknown> | undefined
    )?.["content-disposition"];
    return {
      blob: response.data,
      filename: extraerNombreArchivoDisposition(disposition, fallback),
    };
  } catch (error) {
    if (typeof error === "object" && error !== null && "response" in error) {
      const resp = (error as { response?: { data?: unknown } }).response;
      if (resp?.data instanceof Blob) {
        try {
          const rawText = await resp.data.text();
          resp.data = JSON.parse(rawText) as unknown;
        } catch {
          // conservar Blob si la respuesta no es JSON
        }
      }
    }
    throw error;
  }
}

export async function getActividadDiaria(id: number) {
  const { data } = await http.get<ActividadDiaria>(
    `/actividades-diarias/${id}`,
  );
  return data;
}

export async function registrarActividadDiaria(
  payload: RegistrarActividadDiaria,
) {
  const { data } = await http.post<{
    actividad: ActividadDiaria;
    repetido: boolean;
  }>("/actividades-diarias", payload);
  return data;
}

export async function actualizarActividadDiaria(
  id: number,
  payload: ActualizarActividadDiaria,
) {
  const { data } = await http.patch<ActividadDiaria>(
    `/actividades-diarias/${id}`,
    payload,
  );
  return data;
}

export async function listEvidenciasActividad(actividadId: number) {
  const { data } = await http.get<EvidenciaActividadDiaria[]>(
    `/actividades-diarias/${actividadId}/evidencias`,
  );
  return data;
}

export async function subirEvidenciasActividad(
  actividadId: number,
  archivos: File[],
  onProgress?: (porcentaje: number) => void,
) {
  const formData = new FormData();
  let tamanoTotal = 0;
  for (const archivo of archivos) {
    formData.append("archivos", archivo);
    tamanoTotal += archivo.size;
  }

  const { data } = await http.post<EvidenciaActividadDiaria[]>(
    `/actividades-diarias/${actividadId}/evidencias`,
    formData,
    {
      headers: { "Content-Type": undefined },
      onUploadProgress: (evento) => {
        if (!onProgress) return;
        const total = evento.total ?? tamanoTotal;
        if (total > 0) {
          const porcentaje = Math.min(
            100,
            Math.max(0, Math.round((evento.loaded * 100) / total)),
          );
          onProgress(porcentaje);
        }
      },
    },
  );
  onProgress?.(100);
  return data;
}

export async function obtenerImagenEvidenciaUrlBlob(
  actividadId: number,
  evidenciaId: number,
) {
  const { data } = await http.get<Blob>(
    `/actividades-diarias/${actividadId}/evidencias/${evidenciaId}/archivo`,
    { responseType: "blob" },
  );
  return URL.createObjectURL(data);
}

export async function eliminarEvidenciaActividad(
  actividadId: number,
  evidenciaId: number,
) {
  const { data } = await http.delete<{ id: number }>(
    `/actividades-diarias/${actividadId}/evidencias/${evidenciaId}`,
  );
  return data;
}

export function esErrorDeConexion(error: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return true;
  }
  if (!isAxiosError(error)) return false;
  if (!error.response) return true;
  if (error.code === "ERR_NETWORK" || error.code === "ECONNABORTED") {
    return true;
  }
  return CODIGOS_ESTADO_TRANSITORIOS.has(error.response.status);
}

export function errorActividadDiaria(error: unknown): ErroresActividadDiaria {
  const mensaje: unknown = isAxiosError(error)
    ? error.response?.data?.message
    : null;

  const campos: ErroresActividadDiaria["campos"] = {};

  if (mensaje && typeof mensaje === "object" && !Array.isArray(mensaje)) {
    const errores = mensaje as Record<string, unknown>;
    const camposConocidos: (keyof RegistrarActividadDiaria)[] = [
      "claveOperacion",
      "proyectoId",
      "fecha",
      "nombre",
      "descripcion",
      "observaciones",
    ];
    for (const campo of camposConocidos) {
      const valor = errores[campo];
      if (Array.isArray(valor) && typeof valor[0] === "string") {
        campos[campo] = valor[0];
      } else if (typeof valor === "string") {
        campos[campo] = valor;
      }
    }
    if (Object.keys(campos).length > 0) {
      const primerCampo = Object.values(campos)[0];
      return { campos, general: primerCampo };
    }
  }

  if (typeof mensaje === "string") {
    return { campos, general: mensaje };
  }

  return {
    campos,
    general: "No se pudo guardar el registro de actividad. Inténtalo de nuevo.",
  };
}
