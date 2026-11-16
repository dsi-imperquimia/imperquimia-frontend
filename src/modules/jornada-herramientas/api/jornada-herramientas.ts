import { http } from "@lib/http";
import type { ProyectoDisponibleActividad } from "@modules/actividades-diarias/types/actividad-diaria";
import { isAxiosError } from "axios";
import type {
  AbrirJornadaHerramientas,
  ErrorConfirmarVerificacion,
  EstadoVerificacionHerramienta,
  JornadaHerramientas,
} from "../types/jornada-herramientas";

export async function listProyectosDisponiblesJornada() {
  const { data } = await http.get<ProyectoDisponibleActividad[]>(
    "/jornada-herramientas/proyectos-disponibles",
  );
  return data;
}

export async function abrirJornadaHerramientas(
  payload: AbrirJornadaHerramientas,
) {
  const { data } = await http.post<{
    jornada: JornadaHerramientas;
    repetido: boolean;
  }>("/jornada-herramientas", payload);
  return data;
}

export async function getJornadaHerramientas(
  proyectoId: number,
  empleadoId: number,
  fecha: string,
) {
  const params = new URLSearchParams({
    proyectoId: String(proyectoId),
    empleadoId: String(empleadoId),
    fecha,
  });
  const { data } = await http.get<JornadaHerramientas>(
    `/jornada-herramientas?${params.toString()}`,
  );
  return data;
}

export async function getJornadaHerramientasPorId(id: number) {
  const { data } = await http.get<JornadaHerramientas>(
    `/jornada-herramientas/${id}`,
  );
  return data;
}

export async function verificarItemInicio(
  jornadaId: number,
  itemId: number,
  estado: EstadoVerificacionHerramienta,
  observacion?: string,
) {
  const { data } = await http.patch<JornadaHerramientas>(
    `/jornada-herramientas/${jornadaId}/items/${itemId}/inicio`,
    { estado, observacion: observacion?.trim() || undefined },
  );
  return data;
}

export async function confirmarInicioJornada(jornadaId: number) {
  const { data } = await http.patch<JornadaHerramientas>(
    `/jornada-herramientas/${jornadaId}/confirmar-inicio`,
  );
  return data;
}

export async function verificarItemRetorno(
  jornadaId: number,
  itemId: number,
  estado: EstadoVerificacionHerramienta,
  observacion?: string,
) {
  const { data } = await http.patch<JornadaHerramientas>(
    `/jornada-herramientas/${jornadaId}/items/${itemId}/retorno`,
    { estado, observacion: observacion?.trim() || undefined },
  );
  return data;
}

export async function confirmarRetornoJornada(jornadaId: number) {
  const { data } = await http.patch<JornadaHerramientas>(
    `/jornada-herramientas/${jornadaId}/confirmar-retorno`,
  );
  return data;
}

export function errorJornadaHerramientas(error: unknown): string {
  const mensaje: unknown = isAxiosError(error)
    ? error.response?.data?.message
    : null;
  if (typeof mensaje === "string") return mensaje;
  if (Array.isArray(mensaje) && typeof mensaje[0] === "string") {
    return mensaje[0];
  }
  return "No se pudo completar la operación. Inténtalo de nuevo.";
}

/** Si el 400 de confirmar-inicio trae el detalle de pendientes, lo extrae. */
export function errorConfirmarVerificacion(
  error: unknown,
): ErrorConfirmarVerificacion | null {
  if (!isAxiosError(error)) return null;
  const data: unknown = error.response?.data;
  if (!data || typeof data !== "object") return null;
  const pendientes = (data as Record<string, unknown>).herramientasPendientes;
  if (!Array.isArray(pendientes)) return null;
  const mensaje = (data as Record<string, unknown>).message;
  return {
    general: typeof mensaje === "string" ? mensaje : "Hay herramientas sin verificar.",
    herramientasPendientes: pendientes as ErrorConfirmarVerificacion["herramientasPendientes"],
  };
}
