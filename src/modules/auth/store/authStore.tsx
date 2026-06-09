import type { User } from "@modules/user/types/user";
import { useSelector } from "@tanstack/react-store";
import { Store } from "@tanstack/store";
import { STORAGE_KEY } from "../const/StorageKey";

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
}

export type { AuthState };

const DEFAULT_STATE: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
};

function loadPersistedAuth(): AuthState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return JSON.parse(raw) as AuthState;
  } catch {
    return DEFAULT_STATE;
  }
}

function persistAuth(state: AuthState): void {
  if (typeof window === "undefined") return;
  try {
    // localStorage — for axios interceptor
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    // cookie — for SSR to read on page reload
    const value = encodeURIComponent(JSON.stringify(state));
    const maxAge = state.isAuthenticated ? 24 * 60 * 60 : 0;
    document.cookie = `${STORAGE_KEY}=${value}; path=/; SameSite=Strict; max-age=${maxAge}`;
  } catch {
    // private mode or quota exceeded
  }
}

export const authStore = new Store<AuthState>(loadPersistedAuth());

export const authActions = {
  login: (user: User, token: string) => {
    const next: AuthState = { isAuthenticated: true, user, accessToken: token };
    authStore.setState(() => next);
    persistAuth(next);
  },
  logout: () => {
    authStore.setState(() => DEFAULT_STATE);
    persistAuth(DEFAULT_STATE);
  },
};

export const userActions = {
  hasPermission: (permission: string) => {
    const state = authStore.state;
    if (!state.isAuthenticated || !state.user) return false;
    const allPermissions = [
      ...(state.user.permissions ?? []),
      ...(state.user.role?.permissions ?? []),
    ];

    const findPermission = allPermissions.find(
      (p) => p.name === permission.toUpperCase(),
    );

    return findPermission !== undefined;
  },
  hasAnyPermission: (permissions: string[]) => {
    if (permissions.length === 0) return true;
    const validation = permissions.map((p) => userActions.hasPermission(p));
    return validation.some((v) => v);
  },
};

export function useAuth() {
  const state = useSelector(authStore, (s) => s);
  return { ...state, ...authActions, ...userActions };
}
