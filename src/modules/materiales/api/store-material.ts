import { http } from "@lib/http";
import type { Material } from "../types/material";

export async function storeMaterial(material: Partial<Material>) {
  const request = material.id
    ? http.patch<Material>(`/materiales/${material.id}`, material)
    : http.post<Material>("/materiales", material);

  const { data } = await request;
  return data;
}
