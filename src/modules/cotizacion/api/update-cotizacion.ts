import { http } from "@lib/http";
import type { UpdateCotizacion, CotizacionDetalle } from "../types/cotizacion";

export async function updateCotizacion(id: number, cotizacion: UpdateCotizacion) {
  const { data } = await http.put<CotizacionDetalle>(
    `/cotizaciones/${id}`,
    cotizacion,
  );

  return data;
}