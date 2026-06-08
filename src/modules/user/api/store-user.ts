import { http } from "@lib/http";
import type { User } from "@modules/user/types/user";

export async function storeUser(user: Partial<User>) {
  const request = user.id
    ? http.patch<User>(`/users/${user.id}`, user)
    : http.post<User>("/users", user);

  const { data } = await request;
  return data;
}
