import { http } from "@lib/http";
import type { Proyecto } from "../types/proyectos";
import { isAxiosError } from "axios";
export interface DatosProyecto {
  nombre: string;
  cliente: string;
  descripcion: string;
  ubicacion: string;
  phone: string;
  email: string;
  fechaInicio: string;
  fechaFin: string;
}
export async function guardarProyecto(datos: DatosProyecto, id?: number) {
  const { data } = id
    ? await http.patch<Proyecto>(`/proyectos/${id}`, datos)
    : await http.post<Proyecto>("/proyectos", datos);
  return data;
}
export async function eliminarProyecto(id: number) {
  await http.delete(`/proyectos/${id}`);
}
export function errorProyecto(error: unknown) {
  const mensaje: unknown = isAxiosError(error)
    ? error.response?.data?.message
    : null;
  if (typeof mensaje === "string") return mensaje;
  if (mensaje && typeof mensaje === "object")
    return Object.values(mensaje).flat().join(" · ");
  return "No se pudo guardar el cambio. Inténtalo de nuevo.";
}
