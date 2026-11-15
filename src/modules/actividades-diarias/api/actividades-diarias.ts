import { http } from "@lib/http";
import { isAxiosError } from "axios";
import type {
  ActividadDiaria,
  ActualizarActividadDiaria,
  ErroresActividadDiaria,
  ProyectoDisponibleActividad,
  RegistrarActividadDiaria,
} from "../types/actividad-diaria";

const CODIGOS_ESTADO_TRANSITORIOS = new Set([502, 503, 504]);

export async function listProyectosDisponiblesActividad() {
  const { data } = await http.get<ProyectoDisponibleActividad[]>(
    "/actividades-diarias/proyectos-disponibles",
  );
  return data;
}

export async function listActividadesDiarias(proyectoId?: number | null) {
  const query = proyectoId ? `?proyectoId=${proyectoId}` : "";
  const { data } = await http.get<ActividadDiaria[]>(
    `/actividades-diarias${query}`,
  );
  return data;
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
