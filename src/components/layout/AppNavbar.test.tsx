import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BIENVENIDA_SESSION_KEY } from "@modules/auth/const/StorageKey";
import { AppNavbar } from "./AppNavbar";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  pathname: "/actividades-diarias/editar/1",
  toastSuccess: vi.fn(),
  toastInfo: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  useRouterState: () => ({
    location: { pathname: mocks.pathname },
  }),
}));

vi.mock("@heroui/react/toast", () => ({
  toast: {
    success: mocks.toastSuccess,
    info: mocks.toastInfo,
  },
}));

vi.mock("@modules/alertas/api/alertas", () => ({
  contarAlertasNoLeidas: vi.fn().mockResolvedValue(0),
}));

vi.mock("@modules/auth/store/authStore", () => ({
  userActions: {
    hasAnyPermission: () => false,
    hasPermission: () => false,
  },
  useAuth: () => ({
    user: { id: 7, name: "Carlos" },
  }),
}));

vi.mock("./UserDropdown", () => ({
  UserDropdown: () => <div data-testid="user-dropdown" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
  const sessionMap = new Map<string, string>();
  Object.defineProperty(window, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => sessionMap.get(key) ?? null,
      setItem: (key: string, value: string) => {
        sessionMap.set(key, value);
      },
      removeItem: (key: string) => {
        sessionMap.delete(key);
      },
      clear: () => {
        sessionMap.clear();
      },
    },
  });
});

afterEach(() => {
  cleanup();
});

describe("AppNavbar", () => {
  it("navega por el router SPA al hacer clic en los breadcrumbs y solo muestra el saludo de bienvenida una vez por sesión", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const firstRender = render(
      <QueryClientProvider client={queryClient}>
        <AppNavbar />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledTimes(1));
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "¡Bienvenido, Carlos!",
      expect.objectContaining({
        description: "Has iniciado sesión correctamente.",
      }),
    );
    expect(window.sessionStorage.getItem(BIENVENIDA_SESSION_KEY)).toBe("7");

    fireEvent.click(screen.getByText("Actividades diarias"));
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/actividades-diarias" });

    firstRender.unmount();

    render(
      <QueryClientProvider client={queryClient}>
        <AppNavbar />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledTimes(1));
  });
});
