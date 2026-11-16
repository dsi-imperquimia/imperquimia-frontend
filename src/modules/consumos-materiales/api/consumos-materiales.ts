import { http } from "@lib/http";
import { isAxiosError } from "axios";
import type {
  ConsumosProyectoResponse,
  RegistrarConsumoMaterial,
  DesviacionConsumo,
} from "../types/consumo-material";

export async function getConsumosProyecto(proyectoId: number) {
  const { data } = await http.get<ConsumosProyectoResponse>(
    `/consumos-materiales?proyectoId=${proyectoId}`,
  );
  return data;
}

export async function getDesviacionesProyecto(proyectoId: number) {
  const { data } = await http.get<DesviacionConsumo[]>(
    `/consumos-materiales/desviaciones?proyectoId=${proyectoId}`,
  );
  return data;
}

export async function descargarReporteConsumos(
  proyectoId: number,
  filtros: { desde?: string; hasta?: string },
) {
  const response = await http.get<Blob>(
    `/consumos-materiales/proyectos/${proyectoId}/pdf`,
    { params: filtros, responseType: "blob" },
  );
  const disposition = String(response.headers["content-disposition"] ?? "");
  const filename =
    disposition.match(/filename="?([^";]+)"?/i)?.[1] ??
    `consumos-proyecto-${proyectoId}.pdf`;
  return { blob: response.data, filename };
}

export async function registrarConsumoMaterial(
  payload: RegistrarConsumoMaterial,
) {
  const { data } = await http.post("/consumos-materiales", payload);
  return data;
}

export async function revertirConsumoMaterial(
  consumoId: number,
  payload: { claveOperacion: string; motivo: string },
) {
  const { data } = await http.post(
    `/consumos-materiales/${consumoId}/reverso`,
    payload,
  );
  return data;
}

export async function finalizarProyectoConSaldos(proyectoId: number) {
  const { data } = await http.post(
    `/consumos-materiales/proyectos/${proyectoId}/finalizar`,
  );
  return data;
}

export function errorConsumoMaterial(error: unknown) {
  const message: unknown = isAxiosError(error)
    ? error.response?.data?.message
    : null;
  if (typeof message === "string") return message;
  if (message && typeof message === "object") {
    const first = Object.values(message as Record<string, unknown[]>).flat()[0];
    if (typeof first === "string") return first;
  }
  return "No se pudo completar la operación. Inténtalo de nuevo.";
}
