import { http } from "@lib/http";
import type { Habilidad } from "../types/habilidad";
import type { Empleado } from "../types/empleado";

export async function listHabilidades() {
  const { data } = await http.get<Habilidad[]>("/catalogo-habilidades"); // 👈 Cambiado
  return data;
}

export async function createHabilidad(payload: {
  nombre: string;
  descripcion?: string;
}) {
  const { data } = await http.post<Habilidad>("/catalogo-habilidades", payload); //
  return data;
}

export async function updateHabilidad(
  id: number,
  payload: { nombre: string; descripcion?: string },
) {
  const { data } = await http.patch<Habilidad>(
    `/catalogo-habilidades/${id}`,
    payload,
  ); //
  return data;
}

export async function deleteHabilidad(id: number) {
  await http.delete(`/catalogo-habilidades/${id}`);
}

// GPRCIMPER-90: Sincronización directa desde el perfil
export async function updateHabilidadesEmpleado(
  empleadoId: number,
  habilidadesIds: number[],
) {
  const { data } = await http.patch<Empleado>(
    `/empleados/${empleadoId}/habilidades`,
    { habilidadesIds },
  );
  return data;
}
