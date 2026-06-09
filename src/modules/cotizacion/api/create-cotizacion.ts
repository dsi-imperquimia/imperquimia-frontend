import { http } from "@lib/http";
import type { CreateCotizacion, CotizacionDetalle } from "../types/cotizacion";

export async function createCotizacion(cotizacion: CreateCotizacion) {
  const { data } = await http.post<CotizacionDetalle>(
    "/cotizaciones",
    cotizacion,
  );

  return data;
}