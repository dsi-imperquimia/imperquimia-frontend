import { http } from "@lib/http";
import type { CotizacionDetalle } from "../types/cotizacion";

export async function getCotizacion(id: number) {
  const { data } = await http.get<CotizacionDetalle>(`/cotizaciones/${id}`);
  return data;
}