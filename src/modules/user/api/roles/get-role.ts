import { http } from "@lib/http";
import type { User } from "@modules/user/types/user";

export async function getRole(id: number) {
  const { data } = await http.get<User>(`/roles/${id}`);
  return data;
}
