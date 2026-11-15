import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActividadesDiariasPage } from "../../../routes/_authenticated/actividades-diarias/index";

const mocks = vi.hoisted(() => ({
  listarProyectos: vi.fn(),
  listarActividades: vi.fn(),
  navigate: vi.fn(),
  permisos: ["ACTIVIDAD_CREATE", "ACTIVIDAD_READ"],
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useNavigate: () => mocks.navigate,
  Link: ({
    children,
    to,
    search,
    className,
  }: {
    children: React.ReactNode;
    to: string;
    search?: Record<string, unknown>;
    className?: string;
  }) => (
    <a
      href={to}
      data-search={search ? JSON.stringify(search) : ""}
      className={className}
    >
      {children}
    </a>
  ),
}));

vi.mock("@modules/auth/store/authStore", () => ({
  userActions: {
    hasPermission: (p: string) => mocks.permisos.includes(p),
  },
  useAuth: () => ({
    user: {
      id: 7,
      name: "Carlos",
      lastName: "Pérez",
      role: { name: "Jefe de proyecto" },
    },
    isAuthenticated: true,
    hasPermission: (p: string) => mocks.permisos.includes(p),
    hasAnyPermission: (ps: string[]) =>
      ps.some((p) => mocks.permisos.includes(p)),
  }),
}));

vi.mock("../api/actividades-diarias", async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal();
  return {
    ...actual,
    listProyectosDisponiblesActividad: mocks.listarProyectos,
    listActividadesDiarias: mocks.listarActividades,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  if (typeof window.CSS === "undefined") {
    Object.defineProperty(window, "CSS", {
      configurable: true,
      value: { escape: (val: string) => String(val) },
    });
  } else if (typeof window.CSS.escape !== "function") {
    window.CSS.escape = (val: string) => String(val);
  }
  const store = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    },
  });

  mocks.listarProyectos.mockResolvedValue([
    {
      id: 10,
      nombre: "Proyecto Edificio Central",
      ubicacion: "San Salvador",
      estado: "ACTIVO",
    },
  ]);
  mocks.listarActividades.mockResolvedValue([
    {
      id: 1,
      claveOperacion: "00000000-0000-4000-8000-000000000001",
      proyectoId: 10,
      usuarioId: 7,
      empleadoId: 7,
      fecha: "2026-11-14",
      nombre: "Impermeabilización de cubierta",
      descripcion: "Aplicación en losa norte",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      proyecto: {
        id: 10,
        nombre: "Proyecto Edificio Central",
        estado: "ACTIVO",
      },
    },
  ]);
});

afterEach(() => {
  cleanup();
});

describe("ActividadesDiariasPage", () => {
  it("mantiene el filtro de la lista sin auto-seleccionar proyecto ni preseleccionarlo para Crear", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ActividadesDiariasPage />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("Impermeabilización de cubierta")).toBeTruthy(),
    );

    const filtroProyecto = screen.getByRole("combobox", {
      name: /Filtrar por proyecto/i,
    }) as HTMLInputElement;
    expect(filtroProyecto.value).toBe("");
    expect(mocks.listarActividades).toHaveBeenCalledWith(null);

    fireEvent.click(
      screen.getByRole("button", { name: /Mostrar opciones de Filtrar/i }),
    );
    const opcion = await screen.findByRole("option", {
      name: /Proyecto Edificio Central/i,
    });
    fireEvent.click(opcion);

    await waitFor(() =>
      expect(mocks.listarActividades).toHaveBeenLastCalledWith(10),
    );

    const linkCrear = screen.getByRole("link", {
      name: "Crear actividad diaria",
    });
    expect(linkCrear.getAttribute("href")).toBe("/actividades-diarias/create");
    expect(linkCrear.getAttribute("data-search")).toBe("");
  });

  it("muestra el botón Editar en cada fila y permite abrir la edición desde el botón o al hacer clic en la fila", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ActividadesDiariasPage />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("Impermeabilización de cubierta")).toBeTruthy(),
    );

    const botonEditar = screen.getByRole("button", { name: "Editar" });
    fireEvent.click(botonEditar);
    expect(mocks.navigate).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).toHaveBeenLastCalledWith({
      to: "/actividades-diarias/editar/$actividadId",
      params: { actividadId: "1" },
    });

    fireEvent.click(screen.getByText("Impermeabilización de cubierta"));
    expect(mocks.navigate).toHaveBeenCalledTimes(2);
    expect(mocks.navigate).toHaveBeenLastCalledWith({
      to: "/actividades-diarias/editar/$actividadId",
      params: { actividadId: "1" },
    });
  });
});
