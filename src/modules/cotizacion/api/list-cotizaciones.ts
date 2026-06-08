import { http } from "@lib/http";
import type { CotizacionDetalle } from "../types/cotizacion";

export async function listCotizaciones() {
  const { data } = await http.get<CotizacionDetalle[]>("/cotizaciones");
  return data;
}