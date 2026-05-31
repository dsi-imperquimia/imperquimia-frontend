import { http } from "@lib/http";
import type { User } from "@modules/user/types/user";
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
