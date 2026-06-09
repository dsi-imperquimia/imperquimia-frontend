import { http } from "@lib/http";
import type { Role } from "@modules/user/types/roles";

export async function deleteRole(id: number) {
  const { data } = await http.delete<Role>(`/roles/${id}`);
  return data;
}
