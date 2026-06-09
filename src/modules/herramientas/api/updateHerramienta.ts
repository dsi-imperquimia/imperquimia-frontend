import { http } from "@lib/http";
import type { Herramienta } from "../types/herramientas";

export interface UpdateHerramientaInput {
  nombre?: string;
  marca?: string;
  tipo?: string;
}

export async function updateHerramienta(id: number, payload: UpdateHerramientaInput) {
  const { data } = await http.patch<Herramienta>(`/herramientas/${id}`, payload);
  return data;
}