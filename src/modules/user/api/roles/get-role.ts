import { http } from "@lib/http";
import type { Role } from "@modules/user/types/roles";

export async function getRole(id: number) {
  const { data } = await http.get<Role>(`/roles/${id}`);
  return data;
}
