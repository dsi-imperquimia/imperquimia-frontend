import { http } from "@lib/http";
import type { Cargo } from "../types/cargo";

export async function listCargos() {
  const { data } = await http.get<Cargo[]>("/cargo");
  return data;
}
