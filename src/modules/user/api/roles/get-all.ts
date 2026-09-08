import { http } from "@lib/http";
import type { Role } from "@modules/user/types/roles";

export async function getAllRoles() {
  const { data } = await http.get<Role[]>("/roles");
  return data;
}
