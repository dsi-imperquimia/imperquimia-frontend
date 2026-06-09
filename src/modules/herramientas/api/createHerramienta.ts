import { http } from "@lib/http";
import type { Herramienta } from "../types/herramientas";

export interface CreateHerramientaInput {
  nombre: string;
  marca: string;
  tipo: string;
  proyectoId?: number; 
}

export async function createHerramienta(payload: CreateHerramientaInput) {
  const { data } = await http.post<Herramienta>("/herramientas", payload);
  return data;
}