import { http } from "@lib/http";
import type { Proyecto } from "../types/proyectos";

// Reutilizamos el tipo básico pero extendiendo el array de herramientas si se requiere
export interface ProyectoDetalle extends Proyecto {
  herramientas: any[]; // O el tipo Herramienta importado si quieres tiparlo estricto
}

export async function getProyecto(id: number) {
  const { data } = await http.get<ProyectoDetalle>(`/proyectos/${id}`);
  return data;
}