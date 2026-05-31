import { http } from "@lib/http";
import type { User } from "@modules/user/types/user";

export async function deleteUser(id: number) {
  const { data } = await http.delete<User>(`/users/${id}`);
  return data;
}
