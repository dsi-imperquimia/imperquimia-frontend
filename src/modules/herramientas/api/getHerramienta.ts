import { http } from "@lib/http";
import type { Herramienta } from "../types/herramientas";

export async function getHerramienta(id: number) {
  const { data } = await http.get<Herramienta>(`/herramientas/${id}`);
  return data;
}