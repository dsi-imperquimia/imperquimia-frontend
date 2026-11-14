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
import { TablaActividadesProyecto } from "./TablaActividadesProyecto";

const mocks = vi.hoisted(() => ({
  registrar: vi.fn(),
  actualizar: vi.fn(),
  listarProyectos: vi.fn(),
  rolUsuario: "Jefe de proyecto",
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

vi.mock("@modules/auth/store/authStore", () => ({
  useAuth: () => ({
    user: {
      id: 7,
      name: "Carlos",
      lastName: "Pérez",
      role: { name: mocks.rolUsuario },
    },
    isAuthenticated: true,
  }),
}));

vi.mock("../api/actividades-diarias", async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal();
  return {
    ...actual,
    registrarActividadDiaria: mocks.registrar,
    actualizarActividadDiaria: mocks.actualizar,
    listProyectosDisponiblesActividad: mocks.listarProyectos,
  };
});

const store = new Map<string, string>();

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rolUsuario = "Jefe de proyecto";
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

  const comboProyecto = screen.getByRole("combobox", {
    name: /Proyecto/i,
  }) as HTMLInputElement;
  expect(comboProyecto.value).toBe("Proyecto Edificio Central");

  const selectTrigger = screen.getByRole("button", {
    name: /Proyecto/i,
  });
  fireEvent.click(selectTrigger);
  const opcionProyecto = await screen.findByRole("option", {
    name: /Proyecto Edificio Central/i,
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

  it("CA3 (formulario integrado): permite buscar por nombre directamente dentro del selector Proyecto", async () => {
    mocks.registrar.mockResolvedValue({
      actividad: { id: 2 },
      repetido: false,
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <FormActividadDiaria
          proyectos={[
            {
              id: 1,
              nombre: "Residencial Los Pinos",
              estado: "ACTIVO",
            },
            {
              id: 2,
              nombre: "Bodega Industrial Soyapango",
              estado: "ACTIVO",
            },
          ]}
        />
      </QueryClientProvider>,
    );

    const inputProyecto = screen.getByRole("combobox", {
      name: /Proyecto/i,
    });
    act(() => {
      (inputProyecto as HTMLElement).focus();
    });
    fireEvent.change(inputProyecto, { target: { value: "bodega" } });

    expect(
      screen.queryByRole("option", { name: /Residencial Los Pinos/i }),
    ).toBeNull();
    const opcionFiltrada = await screen.findByRole("option", {
      name: /Bodega Industrial Soyapango/i,
    });
    fireEvent.click(opcionFiltrada);

    fireEvent.change(screen.getByLabelText(/Descripción de la actividad/i), {
      target: { value: "Revisión de drenaje pluvial" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() =>
      expect(mocks.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          proyectoId: 2,
          descripcion: "Revisión de drenaje pluvial",
        }),
      ),
    );
  });
});

describe("Editar registro de actividad diaria (GPRCIMPER-34)", () => {
  it("CA1: el botón Editar está habilitado si la diferencia es menor a 48 horas y deshabilitado si es mayor para Jefe de Proyecto", () => {
    const hace12Horas = new Date(
      Date.now() - 12 * 60 * 60 * 1000,
    ).toISOString();
    const hace50Horas = new Date(
      Date.now() - 50 * 60 * 60 * 1000,
    ).toISOString();

    render(
      <TablaActividadesProyecto
        actividades={[
          {
            id: 101,
            claveOperacion: "00000000-0000-4000-8000-000000000101",
            proyectoId: 10,
            usuarioId: 7,
            empleadoId: 7,
            fecha: "2026-11-14",
            descripcion: "Registro reciente dentro de 48h",
            createdAt: hace12Horas,
            updatedAt: hace12Horas,
          },
          {
            id: 102,
            claveOperacion: "00000000-0000-4000-8000-000000000102",
            proyectoId: 10,
            usuarioId: 7,
            empleadoId: 7,
            fecha: "2026-11-11",
            descripcion: "Registro antiguo mayor a 48h",
            createdAt: hace50Horas,
            updatedAt: hace50Horas,
          },
        ]}
        onEditar={vi.fn()}
      />,
    );

    const botonesEditar = screen.getAllByRole("button", { name: "Editar" });
    expect(botonesEditar).toHaveLength(2);
    expect(botonesEditar[0]?.hasAttribute("disabled")).toBe(false);
    expect(botonesEditar[1]?.hasAttribute("disabled")).toBe(true);
  });

  it("CA1: el botón Editar sigue habilitado después de 48 horas cuando el usuario es de administración", () => {
    mocks.rolUsuario = "Administrador";
    const hace72Horas = new Date(
      Date.now() - 72 * 60 * 60 * 1000,
    ).toISOString();

    render(
      <TablaActividadesProyecto
        actividades={[
          {
            id: 103,
            claveOperacion: "00000000-0000-4000-8000-000000000103",
            proyectoId: 10,
            usuarioId: 7,
            empleadoId: 7,
            fecha: "2026-11-10",
            descripcion: "Registro antiguo editable por administración",
            createdAt: hace72Horas,
            updatedAt: hace72Horas,
          },
        ]}
        onEditar={vi.fn()}
      />,
    );

    const botonEditar = screen.getByRole("button", { name: "Editar" });
    expect(botonEditar.hasAttribute("disabled")).toBe(false);
  });

  it("CA2 y CA3: solicita confirmación antes de sobrescribir el registro y al finalizar muestra que pudo editarlo", async () => {
    const hace2Horas = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    mocks.actualizar.mockResolvedValue({
      id: 101,
      descripcion: "Sellado de juntas corregido",
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <FormActividadDiaria
          actividad={{
            id: 101,
            claveOperacion: "00000000-0000-4000-8000-000000000101",
            proyectoId: 10,
            usuarioId: 7,
            empleadoId: 7,
            fecha: "2026-11-14",
            descripcion: "Sellado de juntas con error",
            observaciones: "Observación inicial",
            createdAt: hace2Horas,
            updatedAt: hace2Horas,
            proyecto: {
              id: 10,
              nombre: "Proyecto Edificio Central",
              estado: "ACTIVO",
            },
          }}
        />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText(/Descripción de la actividad/i), {
      target: { value: "Sellado de juntas corregido" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    // CA2: No debe haber sobrescrito aún sin confirmación previa
    expect(mocks.actualizar).not.toHaveBeenCalled();
    expect(
      await screen.findByText("Confirmar edición de registro"),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar cambios" }));

    await waitFor(() =>
      expect(mocks.actualizar).toHaveBeenCalledWith(
        101,
        expect.objectContaining({
          descripcion: "Sellado de juntas corregido",
        }),
      ),
    );

    // CA3: Muestra al usuario que ha podido editar el registro
    expect(
      await screen.findByText(MENSAJES_ACTIVIDAD.editadoExito),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Aceptar" }));
    await waitFor(() =>
      expect(screen.queryByText(MENSAJES_ACTIVIDAD.editadoExito)).toBeNull(),
    );
  });

  it("CA1 (formulario): bloquea la edición directa si pasaron más de 48 horas y no es administración", () => {
    const hace50Horas = new Date(
      Date.now() - 50 * 60 * 60 * 1000,
    ).toISOString();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <FormActividadDiaria
          actividad={{
            id: 104,
            claveOperacion: "00000000-0000-4000-8000-000000000104",
            proyectoId: 10,
            usuarioId: 7,
            empleadoId: 7,
            fecha: "2026-11-11",
            descripcion: "Registro vencido",
            createdAt: hace50Horas,
            updatedAt: hace50Horas,
          }}
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText(/El plazo de 48 horas para editar este registro/i),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Guardar cambios" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });

  it("ModalResultadoActividad estado 'editado' muestra el mensaje de edición y se cierra al aceptar", () => {
    const onClose = vi.fn();
    render(<ModalResultadoActividad estado="editado" onClose={onClose} />);
    expect(screen.getByText(MENSAJES_ACTIVIDAD.editadoExito)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Aceptar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
