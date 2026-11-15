import { http } from "@lib/http";
import type { EstadoHerramienta, Herramienta } from "../types/herramientas";

interface ListHerramientasParams {
  estado?: EstadoHerramienta;
  proyectoId?: number;
}

export async function listHerramientas(params?: ListHerramientasParams) {
  const { data } = await http.get<Herramienta[]>("/herramientas", { params });
  return data;
}
