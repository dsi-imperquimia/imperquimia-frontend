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
import { fechaHoyIso, restarDiasIso } from "../types/actividad-diaria";

const mocks = vi.hoisted(() => ({
  listarProyectos: vi.fn(),
  listarActividades: vi.fn(),
  exportarActividades: vi.fn(),
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
    exportarActividadesDiarias: mocks.exportarActividades,
    listEvidenciasActividad: vi.fn().mockResolvedValue([]),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:mock-reporte"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
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
  mocks.exportarActividades.mockResolvedValue({
    blob: new Blob(["ok"]),
    filename: "actividades-diarias.pdf",
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe("ActividadesDiariasPage", () => {
  it("autoselecciona el único proyecto activo en la bitácora sin mostrar botón manual de crear actividad (GPRCIMPER-29)", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ActividadesDiariasPage />
      </QueryClientProvider>,
    );

    const filtroProyecto = screen.getByRole("combobox", {
      name: /Filtrar por proyecto/i,
    }) as HTMLInputElement;

    await waitFor(() =>
      expect(filtroProyecto.value).toBe("Proyecto Edificio Central"),
    );
    await waitFor(() =>
      expect(mocks.listarActividades).toHaveBeenLastCalledWith(10),
    );

    expect(
      screen.getByLabelText("Proyecto seleccionado en bitácora").textContent,
    ).toContain("1 registro(s)");
    expect(
      screen.queryByRole("button", { name: "Ver todos los proyectos" }),
    ).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Crear actividad diaria" }),
    ).toBeNull();
  });

  it("permite buscar y seleccionar entre múltiples proyectos activos y volver a ver todos (GPRCIMPER-29)", async () => {
    mocks.listarProyectos.mockResolvedValue([
      {
        id: 10,
        nombre: "Proyecto Edificio Central",
        ubicacion: "San Salvador",
        estado: "ACTIVO",
      },
      {
        id: 22,
        nombre: "Bodega Industrial Norte",
        ubicacion: "Soyapango",
        estado: "ACTIVO",
      },
    ]);

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
    expect(mocks.listarActividades).toHaveBeenLastCalledWith(null);

    fireEvent.click(
      screen.getByRole("button", { name: /Mostrar opciones de Filtrar/i }),
    );
    const opcion = await screen.findByRole("option", {
      name: /Bodega Industrial Norte/i,
    });
    fireEvent.click(opcion);

    await waitFor(() =>
      expect(mocks.listarActividades).toHaveBeenLastCalledWith(22),
    );
    expect(
      screen.getByLabelText("Proyecto seleccionado en bitácora").textContent,
    ).toContain("Bodega Industrial Norte");

    fireEvent.click(
      screen.getByRole("button", { name: "Ver todos los proyectos" }),
    );
    await waitFor(() =>
      expect(mocks.listarActividades).toHaveBeenLastCalledWith(null),
    );
    expect(filtroProyecto.value).toBe("");
  });

  it("muestra 'Registrar' en actividades pendientes generadas por el sistema y 'Editar' en registros ya guardados", async () => {
    mocks.listarActividades.mockResolvedValue([
      {
        id: 77,
        claveOperacion: "00000000-0000-4000-8000-000000000077",
        proyectoId: 10,
        usuarioId: 7,
        empleadoId: 7,
        fecha: "2026-11-14",
        nombre: "Bitácora del día 2026-11-14",
        descripcion: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        proyecto: {
          id: 10,
          nombre: "Proyecto Edificio Central",
          estado: "ACTIVO",
        },
      },
      {
        id: 1,
        claveOperacion: "00000000-0000-4000-8000-000000000001",
        proyectoId: 10,
        usuarioId: 7,
        empleadoId: 7,
        fecha: "2026-11-13",
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

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ActividadesDiariasPage />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(
        screen.getByText("Pendiente de registrar (generada por el sistema)"),
      ).toBeTruthy(),
    );
    expect(screen.getByText("Sistema (pendiente)")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Registrar" }));
    expect(mocks.navigate).toHaveBeenLastCalledWith({
      to: "/actividades-diarias/editar/$actividadId",
      params: { actividadId: "77" },
    });

    const botonEditar = screen.getByRole("button", { name: "Editar" });
    fireEvent.click(botonEditar);
    expect(mocks.navigate).toHaveBeenLastCalledWith({
      to: "/actividades-diarias/editar/$actividadId",
      params: { actividadId: "1" },
    });
  });

  it("filtra dinámicamente por rango de fechas, soporta el preset 'Última semana' y valida rangos invertidos (GPRIMPER-43)", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ActividadesDiariasPage />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(mocks.listarActividades).toHaveBeenLastCalledWith(10),
    );

    const inputInicio = screen.getByLabelText(
      "Fecha inicio",
    ) as HTMLInputElement;
    const inputFin = screen.getByLabelText("Fecha fin") as HTMLInputElement;

    fireEvent.change(inputInicio, { target: { value: "2026-11-01" } });
    fireEvent.change(inputFin, { target: { value: "2026-11-10" } });

    await waitFor(() =>
      expect(mocks.listarActividades).toHaveBeenLastCalledWith({
        proyectoId: 10,
        fechaInicio: "2026-11-01",
        fechaFin: "2026-11-10",
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Última semana" }));
    const hoyIso = fechaHoyIso();
    const inicioSemana = restarDiasIso(7, hoyIso);

    expect(inputInicio.value).toBe(inicioSemana);
    expect(inputFin.value).toBe(hoyIso);
    await waitFor(() =>
      expect(mocks.listarActividades).toHaveBeenLastCalledWith({
        proyectoId: 10,
        fechaInicio: inicioSemana,
        fechaFin: hoyIso,
      }),
    );

    fireEvent.change(inputInicio, { target: { value: "2026-11-14" } });
    fireEvent.change(inputFin, { target: { value: "2026-11-01" } });

    expect(
      screen.getByText(
        "La fecha de inicio no puede ser mayor que la fecha fin.",
      ),
    ).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: "Exportar PDF",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "Exportar Excel",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("permite exportar las actividades filtradas a PDF y Excel (GPRIMPER-43)", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ActividadesDiariasPage />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(mocks.listarActividades).toHaveBeenLastCalledWith(10),
    );

    fireEvent.change(screen.getByLabelText("Fecha inicio"), {
      target: { value: "2026-11-07" },
    });
    fireEvent.change(screen.getByLabelText("Fecha fin"), {
      target: { value: "2026-11-14" },
    });

    await waitFor(() =>
      expect(mocks.listarActividades).toHaveBeenLastCalledWith({
        proyectoId: 10,
        fechaInicio: "2026-11-07",
        fechaFin: "2026-11-14",
      }),
    );

    await waitFor(() =>
      expect(
        (
          screen.getByRole("button", {
            name: "Exportar PDF",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false),
    );

    fireEvent.click(screen.getByRole("button", { name: "Exportar PDF" }));
    await waitFor(() =>
      expect(mocks.exportarActividades).toHaveBeenCalledWith("pdf", {
        proyectoId: 10,
        fechaInicio: "2026-11-07",
        fechaFin: "2026-11-14",
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Exportar Excel" }));
    await waitFor(() =>
      expect(mocks.exportarActividades).toHaveBeenCalledWith("excel", {
        proyectoId: 10,
        fechaInicio: "2026-11-07",
        fechaFin: "2026-11-14",
      }),
    );

    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it("permite abrir el modal de evidencias fotográficas desde cada fila sin navegar a edición (GPRIMPER-53)", async () => {
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

    fireEvent.click(screen.getByRole("button", { name: "Evidencias (0)" }));

    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(await screen.findByText("Evidencias de actividad")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Tomar foto/i })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Elegir de la galería/i }),
    ).toBeTruthy();
  });

  it("limpia el texto escrito en el filtro de proyecto aunque selectedProyectoId ya sea null al usar 'Limpiar filtros'", async () => {
    mocks.listarProyectos.mockResolvedValue([
      {
        id: 10,
        nombre: "Proyecto Edificio Central",
        ubicacion: "San Salvador",
        estado: "ACTIVO",
      },
      {
        id: 22,
        nombre: "Bodega Industrial Norte",
        ubicacion: "Soyapango",
        estado: "ACTIVO",
      },
    ]);

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

    fireEvent.change(filtroProyecto, { target: { value: "xyz" } });
    expect(filtroProyecto.value).toBe("xyz");

    fireEvent.click(screen.getByRole("button", { name: "Última semana" }));
    const botonLimpiar = await screen.findByRole("button", {
      name: "Limpiar filtros",
    });

    fireEvent.click(botonLimpiar);

    await waitFor(() => expect(filtroProyecto.value).toBe(""));
    await waitFor(() =>
      expect(mocks.listarActividades).toHaveBeenLastCalledWith(null),
    );
  });
});
