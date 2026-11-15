import { http } from "@lib/http";
import type { MiAsignacionDetalle, MisAsignaciones } from "../types/asignacion";

export async function listMisAsignaciones() {
  const { data } = await http.get<MisAsignaciones>("/empleados/me/asignaciones");
  return data;
}

export async function getMiAsignacion(proyectoId: number) {
  const { data } = await http.get<MiAsignacionDetalle>(
    `/empleados/me/asignaciones/${proyectoId}`,
  );
  return data;
}

export async function marcarAsignacionVista(proyectoId: number) {
  await http.patch(`/empleados/me/asignaciones/${proyectoId}/vista`);
}

export function mapaUrl(ubicacion: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ubicacion)}`;
}
