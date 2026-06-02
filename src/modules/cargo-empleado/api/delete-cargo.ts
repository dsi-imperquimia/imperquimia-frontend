import { http } from "@lib/http";
import type { Cargo } from "../types/cargo";

export async function deleteCargo(id: number) {
  const { data } = await http.delete<Cargo>(`/cargo/${id}`);
  return data;
}
