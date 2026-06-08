import { http } from "@lib/http";
import type { Habilidad } from "../types/habilidad";

export async function listHabilidades() {
  const { data } = await http.get<Habilidad[]>("/empleados/habilidades");
  return data;
}

export async function createHabilidad(payload: { nombre: string; descripcion?: string }) {
  const { data } = await http.post<Habilidad>("/empleados/habilidades", payload);
  return data;
}

export async function updateHabilidad(id: number, payload: { nombre: string; descripcion?: string }) {
  const { data } = await http.patch<Habilidad>(`/empleados/habilidades/${id}`, payload);
  return data;
}

export async function deleteHabilidad(id: number) {
  await http.delete(`/empleados/habilidades/${id}`);
}

// GPRCIMPER-90: Sincronización directa desde el perfil
export async function updateHabilidadesEmpleado(empleadoId: number, habilidadesIds: number[]) {
  const { data } = await http.patch(`/empleados/${empleadoId}/habilidades`, { habilidadesIds });
  return data;
}