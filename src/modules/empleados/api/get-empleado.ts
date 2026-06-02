import { http } from "@lib/http";
import type { Empleado } from "../types/empleado";

export async function getEmpleado(id: number) {
  const { data } = await http.get<Empleado>(`/empleados/${id}`);
  return data;
}
