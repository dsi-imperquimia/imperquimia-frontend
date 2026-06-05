import { http } from "@lib/http";
import type { Empleado } from "../types/empleado";

export async function storeEmpleado(empleado: Partial<Empleado>) {
  const request = empleado.id
    ? http.patch<Empleado>(`/empleados/${empleado.id}`, empleado)
    : http.post<Empleado>("/empleados", empleado);

  const { data } = await request;
  return data;
}
