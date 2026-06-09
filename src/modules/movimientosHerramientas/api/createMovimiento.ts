import { http } from "@lib/http";
import type { CreateMovimientoInput, MovimientoHerramienta } from "../types/movimientos";

export async function createMovimiento(payload: CreateMovimientoInput) {
  const { data } = await http.post<MovimientoHerramienta>("/movimientos", payload);
  return data;
}