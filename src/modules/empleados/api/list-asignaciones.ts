import { http } from "@lib/http";
import type { AsignacionEmpleado } from "../types/asignacion";

export async function listAsignacionesEmpleados() {
  const { data } = await http.get<AsignacionEmpleado[]>(
    "/empleados/asignaciones",
  );
  return data;
}
