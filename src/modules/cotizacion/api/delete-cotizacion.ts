import { http } from "@lib/http";

import type { CotizacionDetalle } from "../types/cotizacion";

export async function deleteCotizacion(id: number) {
  const { data } = await http.delete<CotizacionDetalle>(`/cotizaciones/${id}`);

  return data;
}
