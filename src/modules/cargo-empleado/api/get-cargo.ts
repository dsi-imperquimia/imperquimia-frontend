import { http } from "@lib/http";
import type { Cargo } from "../types/cargo";

export async function getCargo(id: number) {
  const { data } = await http.get<Cargo>(`/cargo/${id}`);
  return data;
}
