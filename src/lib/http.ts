import { STORAGE_KEY } from "@modules/auth/const/StorageKey";
import axios from "axios";

export const http = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string | undefined) ?? "",
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const token = raw
      ? (JSON.parse(raw) as { accessToken?: string | null }).accessToken
      : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // storage unavailable or malformed JSON — skip header
  }
  return config;
});
