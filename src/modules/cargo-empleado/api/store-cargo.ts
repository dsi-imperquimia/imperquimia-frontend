import { http } from "@lib/http";
import type { Cargo } from "../types/cargo";

export async function storeCargo(cargo: Partial<Cargo>) {
  const request = cargo.id
    ? http.patch<Cargo>(`/cargo/${cargo.id}`, cargo)
    : http.post<Cargo>("/cargo", cargo);

  const { data } = await request;
  return data;
}
