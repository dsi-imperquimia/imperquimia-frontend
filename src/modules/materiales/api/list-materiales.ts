import { http } from "@lib/http";
import type { Material } from "../types/material";

export async function listMateriales() {
  const { data } = await http.get<Material[]>("/materiales");
  return data;
}
