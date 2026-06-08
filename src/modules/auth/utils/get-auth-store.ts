import { createIsomorphicFn } from "@tanstack/react-start";
import { STORAGE_KEY } from "../const/StorageKey";
import type { AuthState } from "../store/authStore";

const DEFAULT_AUTH: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
};

export const getAuth = createIsomorphicFn()
  .client(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_AUTH;
      return (JSON.parse(raw) ?? DEFAULT_AUTH) as AuthState;
    } catch {
      return DEFAULT_AUTH;
    }
  })
  .server(async () => {
    const { getCookie } = await import("@tanstack/react-start/server");
    const raw = getCookie(STORAGE_KEY);
    if (!raw) return DEFAULT_AUTH;
    try {
      return JSON.parse(decodeURIComponent(raw) ?? DEFAULT_AUTH) as AuthState;
    } catch {
      return DEFAULT_AUTH;
    }
  });
