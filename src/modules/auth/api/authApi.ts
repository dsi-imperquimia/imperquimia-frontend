import { http } from "@lib/http";
import type { User } from "@modules/user/types/user";
import { queryOptions } from "@tanstack/react-query";
import axios from "axios";

interface LoginResponse {
  user: User;
  access_token: string;
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<LoginResponse> {
  try {
    const { data } = await http.post<LoginResponse>("/auth/login", {
      email,
      password,
    });
    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const message = (err.response?.data as { message?: string })?.message;
      throw new Error(message ?? "Credenciales inválidas");
    }
    throw err;
  }
}

export async function getMe(): Promise<User> {
  const { data } = await http.get<User>("/auth/me");
  return data;
}

export const authMeQueryOptions = () =>
  queryOptions({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    staleTime: 1000 * 60 * 1, // evita llamar /auth/me en cada navegación
  });
