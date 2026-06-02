import { http } from "@lib/http";
import type { Empleado } from "../types/empleado";

export async function deleteEmpleado(id: number) {
  const { data } = await http.delete<Empleado>(`/empleados/${id}`);
  return data;
}
