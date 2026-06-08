import { http } from "@lib/http";
import type { Role } from "@modules/user/types/roles";

type StoreRoleParams = Omit<Partial<Role>, "permissions" | "permissionsIds"> & {
  permissions?: number[];
};

export async function storeRole(role: Partial<Role>) {
  const roleData: StoreRoleParams = {
    name: role.name,
    description: role?.description,
    permissions: role?.permissionsIds ?? [],
  };

  const request = role.id
    ? http.patch<Role>(`/roles/${role.id}`, roleData)
    : http.post<Role>("/roles", roleData);

  const { data } = await request;
  return data;
}
