import { http } from "@lib/http";
import type { User } from "@modules/user/types/user";

export async function listUsers() {
  const { data } = await http.get<User[]>("/users");
  return data;
}
