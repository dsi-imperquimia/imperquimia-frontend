import { http } from "@lib/http";
import type { Empleado } from "../types/empleado";

export async function listEmpleados() {
  const { data } = await http.get<Empleado[]>("/empleados");
  return data;
}
