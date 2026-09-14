import { http } from "@lib/http";
import type { ProyectoDetalle } from "../types/proyectos";
export type { ProyectoDetalle } from "../types/proyectos";
export async function getProyecto(id: number) {
  const { data } = await http.get<ProyectoDetalle>(`/proyectos/${id}`);
  return data;
}
