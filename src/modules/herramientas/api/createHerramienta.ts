import { http } from "@lib/http";
import type { Herramienta } from "../types/herramientas";

export interface CreateHerramientaInput {
  nombre: string;
  marcaId: number;
  tipoId: number;
  proyectoId?: number; 
}

export async function createHerramienta(payload: CreateHerramientaInput) {
  const { data } = await http.post<Herramienta>("/herramientas", payload);
  return data;
}
