import { http } from "@lib/http";
import type { Permission } from "@modules/user/types/permission";

export async function getAllPermissions() {
  const { data } = await http.get<Permission[]>("/permissions");
  return data;
}
