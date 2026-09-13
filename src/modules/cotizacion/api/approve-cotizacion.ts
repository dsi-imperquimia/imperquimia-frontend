import { http } from "@lib/http";

import type { CotizacionDetalle } from "../types/cotizacion";

interface AprobarCotizacionResponse {
  message: string;
  cotizacion: CotizacionDetalle;
  proyecto: {
    id: number;
    nombre: string;
    ubicacion: string | null;
    estado: string;
    cotizacionId: number | null;
    createdAt: string;
    updatedAt: string;
  };
}

export async function approveCotizacion(id: number) {
  const { data } = await http.patch<AprobarCotizacionResponse>(
    `/cotizaciones/${id}/aprobar`,
  );

  return data;
}
