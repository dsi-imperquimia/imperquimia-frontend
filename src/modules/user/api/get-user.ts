import { http } from "@lib/http";
import type { User } from "@modules/user/types/user";

export async function getUser(id: number) {
  const { data } = await http.get<User>(`/users/${id}`);
  return data;
}
