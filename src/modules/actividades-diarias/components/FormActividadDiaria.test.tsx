import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listarBorradoresActividad } from "../api/borradores-actividad";
import {
  DURACION_MINIMA_MODAL_MS,
  MENSAJES_ACTIVIDAD,
} from "../types/actividad-diaria";
import { FormActividadDiaria } from "./FormActividadDiaria";
import { ListaProyectosAsignadosActividad } from "./ListaProyectosAsignadosActividad";
import { ModalResultadoActividad } from "./ModalResultadoActividad";

const mocks = vi.hoisted(() => ({
  registrar: vi.fn(),
  listarProyectos: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

vi.mock("@modules/auth/store/authStore", () => ({
  useAuth: () => ({
    user: { id: 7, name: "Carlos", lastName: "Pérez" },
    isAuthenticated: true,
  }),
}));

vi.mock("../api/actividades-diarias", async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal();
  return {
    ...actual,
    registrarActividadDiaria: mocks.registrar,
    listProyectosDisponiblesActividad: mocks.listarProyectos,
  };
});

const store = new Map<string, string>();

beforeEach(() => {
  vi.clearAllMocks();
  store.clear();
  if (typeof window.CSS === "undefined") {
    Object.defineProperty(window, "CSS", {
      configurable: true,
      value: { escape: (val: string) => String(val) },
    });
  } else if (typeof window.CSS.escape !== "function") {
    window.CSS.escape = (val: string) => String(val);
  }
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
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

async function montarYCompletarFormulario() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <FormActividadDiaria />
    </QueryClientProvider>,
  );

  await waitFor(() =>
    expect(screen.queryByText("Cargando proyectos asignados…")).toBeNull(),
  );

  const selectTrigger = screen.getByRole("button", {
    name: /Proyecto/i,
  });
  fireEvent.click(selectTrigger);
  const opcionProyecto = await screen.findByRole("option", {
    name: "Proyecto Edificio Central",
  });
  fireEvent.click(opcionProyecto);

  fireEvent.change(screen.getByLabelText(/Descripción de la actividad/i), {
    target: { value: "Impermeabilización de losa en nivel 3" },
  });
}

describe("FormActividadDiaria y ModalResultadoActividad (GPRCIMPER-50)", () => {
  it("CA1: al presionar Enviar muestra un modal con '¡Registro guardado con éxito!'", async () => {
    mocks.registrar.mockResolvedValue({
      actividad: { id: 1 },
      repetido: false,
    });

    await montarYCompletarFormulario();
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() =>
      expect(mocks.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          proyectoId: 10,
          descripcion: "Impermeabilización de losa en nivel 3",
        }),
      ),
    );

    const modalMensaje = await screen.findByText(MENSAJES_ACTIVIDAD.exito);
    expect(modalMensaje).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("CA2: el modal de éxito permanece visible al menos 3 segundos y no se cierra antes", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    render(<ModalResultadoActividad estado="exito" onClose={onClose} />);

    expect(screen.getByText(MENSAJES_ACTIVIDAD.exito)).toBeTruthy();
    const botonAceptar = screen.getByRole("button", { name: "Aceptar" });
    expect(botonAceptar.hasAttribute("disabled")).toBe(true);

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(botonAceptar);

    act(() => {
      vi.advanceTimersByTime(DURACION_MINIMA_MODAL_MS - 1);
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText(MENSAJES_ACTIVIDAD.exito)).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("CA3: ante un error de conexión muestra 'Error al guardar, tu trabajo se ha movido a los borradores' y guarda en localStorage", async () => {
    mocks.registrar.mockRejectedValue(
      new AxiosError("Network Error", "ERR_NETWORK"),
    );

    await montarYCompletarFormulario();
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    const mensajeError = await screen.findByText(
      MENSAJES_ACTIVIDAD.errorConexion,
    );
    expect(mensajeError).toBeTruthy();

    const borradores = listarBorradoresActividad(7);
    expect(borradores).toHaveLength(1);
    expect(borradores[0]?.payload.descripcion).toBe(
      "Impermeabilización de losa en nivel 3",
    );
    expect(screen.getByText("Borradores (1)")).toBeTruthy();
  });

  it("no mueve a borradores cuando el backend devuelve un error 400 de validación", async () => {
    mocks.registrar.mockRejectedValue(
      new AxiosError("Bad Request", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {} as any,
        data: {
          message: {
            descripcion: ["La descripción admite hasta 2000 caracteres."],
          },
        },
      }),
    );

    await montarYCompletarFormulario();
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    await screen.findByText("La descripción admite hasta 2000 caracteres.");
    expect(listarBorradoresActividad(7)).toHaveLength(0);
    expect(screen.queryByText(MENSAJES_ACTIVIDAD.errorConexion)).toBeNull();
  });
});

describe("ListaProyectosAsignadosActividad (GPRCIMPER-29)", () => {
  it("CA1: muestra solo los proyectos con estado ACTIVO asignados como Jefe de Proyecto", () => {
    render(
      <ListaProyectosAsignadosActividad
        proyectos={[
          {
            id: 1,
            nombre: "Residencial Los Pinos",
            estado: "ACTIVO",
          },
          {
            id: 2,
            nombre: "Proyecto Antiguo Finalizado",
            estado: "FINALIZADO",
          },
        ]}
        selectedProyectoId={1}
        onSelectProyecto={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Residencial Los Pinos").length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByText("Proyecto Antiguo Finalizado")).toBeNull();
  });

  it("CA2: si el usuario solamente tiene un proyecto activo, aparece seleccionado por defecto", async () => {
    const onSelect = vi.fn();
    render(
      <ListaProyectosAsignadosActividad
        proyectos={[
          {
            id: 15,
            nombre: "Torre Corporativa Imperquimia",
            estado: "ACTIVO",
          },
        ]}
        selectedProyectoId={null}
        onSelectProyecto={onSelect}
      />,
    );

    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 15,
          nombre: "Torre Corporativa Imperquimia",
        }),
      ),
    );
  });

  it("CA3: permite búsqueda rápida por nombre de proyecto", () => {
    render(
      <ListaProyectosAsignadosActividad
        proyectos={[
          {
            id: 1,
            nombre: "Bodega Industrial Soyapango",
            estado: "ACTIVO",
          },
          {
            id: 2,
            nombre: "Centro Comercial Santa Tecla",
            estado: "ACTIVO",
          },
        ]}
        selectedProyectoId={1}
        onSelectProyecto={vi.fn()}
      />,
    );

    expect(
      screen.getAllByText("Bodega Industrial Soyapango").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Centro Comercial Santa Tecla")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Buscar proyecto"), {
      target: { value: "santa tecla" },
    });

    expect(
      screen.queryByRole("row", { name: /Bodega Industrial Soyapango/i }),
    ).toBeNull();
    expect(screen.getByText("Centro Comercial Santa Tecla")).toBeTruthy();
  });
});
