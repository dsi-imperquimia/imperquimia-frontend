import { http } from "@lib/http";
import { isAxiosError } from "axios";
import type {
  RegistrarDevolucionMaterialesProyecto,
  ExistenciaMaterial,
  MovimientoMaterial,
  RegistrarMovimientoMaterial,
  RegistrarSalidaMaterialesProyecto,
} from "../types/inventario-material";

export async function listExistenciasMateriales() {
  const { data } = await http.get<ExistenciaMaterial[]>(
    "/inventario-materiales/existencias",
  );
  return data;
}

export async function listMovimientosMateriales(filters?: {
  materialId?: string;
  proyectoId?: string;
  desde?: string;
  hasta?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.materialId) params.set("materialId", filters.materialId);
  if (filters?.proyectoId) params.set("proyectoId", filters.proyectoId);
  if (filters?.desde) params.set("desde", filters.desde);
  if (filters?.hasta) params.set("hasta", filters.hasta);
  const { data } = await http.get<MovimientoMaterial[]>(
    `/inventario-materiales/movimientos${params.size ? `?${params}` : ""}`,
  );
  return data;
}

export async function registrarMovimientoMaterial(
  tipo: "ENTRADA" | "SALIDA",
  payload: RegistrarMovimientoMaterial,
) {
  const path = tipo === "ENTRADA" ? "entradas" : "salidas";
  const { data } = await http.post<{
    movimiento: MovimientoMaterial;
    repetido: boolean;
  }>(`/inventario-materiales/${path}`, payload);
  return data;
}

export async function registrarSalidaMaterialesProyecto(
  payload: RegistrarSalidaMaterialesProyecto,
) {
  const { data } = await http.post<{
    movimientos: MovimientoMaterial[];
    repetido: boolean;
  }>("/inventario-materiales/salidas/proyecto", payload);
  return data;
}

export async function registrarDevolucionMaterialesProyecto(
  payload: RegistrarDevolucionMaterialesProyecto,
) {
  const { data } = await http.post<{
    movimientos: MovimientoMaterial[];
    repetido: boolean;
  }>("/inventario-materiales/entradas/proyecto", payload);
  return data;
}

export function errorMovimientoMaterial(error: unknown) {
  const message: unknown = isAxiosError(error)
    ? error.response?.data?.message
    : null;
  if (typeof message === "string") return message;
  if (message && typeof message === "object") {
    const first = Object.values(message as Record<string, unknown[]>).flat()[0];
    if (typeof first === "string") return first;
  }
  return "No se pudo registrar el movimiento. Inténtalo de nuevo.";
}
