import { http } from "@lib/http";
import type { Empleado, GuardarEmpleado } from "../types/empleado";

export async function storeEmpleado(empleado: GuardarEmpleado) {
  const { id, nombreCompleto, dui, nit, cargoId, activo, habilidadesIds } =
    empleado;
  const payload = {
    nombreCompleto,
    dui,
    nit,
    cargoId,
    activo,
    ...(habilidadesIds !== undefined && { habilidadesIds }),
  };
  const request = id
    ? http.patch<Empleado>(`/empleados/${id}`, payload)
    : http.post<Empleado>("/empleados", payload);

  const { data } = await request;
  return data;
}
