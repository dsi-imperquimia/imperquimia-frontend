import { getAuth } from "@modules/auth/utils/get-auth-store";
import { createIsomorphicFn } from "@tanstack/react-start";
import axios from "axios";

const getBaseURL = createIsomorphicFn()
  .client(() => (import.meta.env.VITE_API_URL as string | undefined) ?? "")
  .server(() => (import.meta.env.VITE_API_URL_SSR as string | undefined) ?? "");

export const http = axios.create({
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use(async (config) => {
  const token = (await getAuth()).accessToken;
  const baseURL = getBaseURL();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (baseURL) config.baseURL = baseURL;
  return config;
});
