import { http } from "@lib/http";
import type { ReporteDefectoHerramienta } from "../types/herramientas";

export async function listReportesDefecto(herramientaId: number) {
  const { data } = await http.get<ReporteDefectoHerramienta[]>(
    `/herramientas/${herramientaId}/reportes-defecto`,
  );
  return data;
}

export async function crearReporteDefecto(
  herramientaId: number,
  observacion: string,
) {
  const { data } = await http.post<ReporteDefectoHerramienta>(
    `/herramientas/${herramientaId}/reportes-defecto`,
    { observacion },
  );
  return data;
}
