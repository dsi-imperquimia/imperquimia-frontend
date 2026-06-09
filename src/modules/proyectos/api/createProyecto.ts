import { http } from "@lib/http";
import type { Proyecto } from "../types/proyectos";

export interface CreateProyectoInput {
  nombre: string;
  ubicacion?: string;
}

export async function createProyecto(payload: CreateProyectoInput) {
  const { data } = await http.post<Proyecto>("/proyectos", payload);
  return data;
}