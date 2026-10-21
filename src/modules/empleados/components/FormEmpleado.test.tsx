import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormEmpleado } from "./FormEmpleado";
import type * as ToastModule from "@heroui/react/toast";
import type { Empleado } from "../types/empleado";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  success: vi.fn(),
  navigate: vi.fn(),
  invalidate: vi.fn(),
}));
vi.mock("@lib/http", () => ({ http: mocks }));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  useRouter: () => ({ invalidate: mocks.invalidate }),
}));
vi.mock("@heroui/react/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof ToastModule>()),
  toast: { success: mocks.success, danger: vi.fn() },
}));

const habilidades = [
  {
    id: 7,
    nombre: "Impermeabilización",
    descripcion: "Aplicación de recubrimientos",
  },
  { id: 12, nombre: "Pintura", descripcion: "Preparación y acabado" },
];
const empleado: Empleado = {
  id: 41,
  nombreCompleto: "Empleado de prueba",
  dui: "00000000-0",
  nit: "0000-000000-000-0",
  cargoId: 2,
  cargo: { id: 2, nombre: "Técnico" },
  activo: true,
  fechaRegistro: new Date(),
  habilidades: [
    {
      empleadoId: 41,
      habilidadId: 7,
      assignedAt: "2020-01-01T00:00:00Z",
      habilidad: habilidades[0],
    },
  ],
};

function mount(initial: Partial<Empleado> = empleado) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const result = render(
    <QueryClientProvider client={client}>
      <FormEmpleado empleado={initial} />
    </QueryClientProvider>,
  );
  return { ...result, client };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockImplementation(async (url: string) => ({
    data: url === "/cargo" ? [empleado.cargo] : habilidades,
  }));
  const saved = async (
    _url: string,
    payload: { habilidadesIds: number[] },
  ) => ({
    data: {
      ...empleado,
      ...payload,
      habilidades: payload.habilidadesIds.map((id) => ({
        empleadoId: empleado.id,
        habilidadId: id,
        assignedAt: "2020-01-01T00:00:00Z",
        habilidad: habilidades.find((h) => h.id === id),
      })),
    },
  });
  mocks.patch.mockImplementation(saved);
  mocks.post.mockImplementation(saved);
});

afterEach(cleanup);

describe("Formulario de empleado y habilidades", () => {
  it("precarga las habilidades y guarda solo los campos editables al cambiarlas", async () => {
    const { client } = mount();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const primera = await screen.findByRole("checkbox", {
      name: "Impermeabilización",
    });
    expect((primera as HTMLInputElement).checked).toBe(true);
    fireEvent.click(primera);
    fireEvent.click(screen.getByRole("checkbox", { name: "Pintura" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar empleado" }));

    await waitFor(() =>
      expect(mocks.patch).toHaveBeenCalledWith("/empleados/41", {
        nombreCompleto: empleado.nombreCompleto,
        dui: empleado.dui,
        nit: empleado.nit,
        cargoId: 2,
        activo: true,
        habilidadesIds: [12],
      }),
    );
    await waitFor(() => expect(mocks.success).toHaveBeenCalledTimes(1));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["empleados"] });
    expect(mocks.invalidate).toHaveBeenCalled();
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Pintura" }).checked).toBe(
      true,
    );
  });

  it("envía una lista vacía cuando se quitan todas", async () => {
    mount();
    await screen.findByRole("checkbox", { name: "Impermeabilización" });
    fireEvent.click(screen.getByRole("button", { name: "Quitar todas" }));
    expect(screen.getByText("0 habilidades seleccionadas")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Guardar empleado" }));
    await waitFor(() =>
      expect(mocks.patch).toHaveBeenCalledWith(
        "/empleados/41",
        expect.objectContaining({ habilidadesIds: [] }),
      ),
    );
  });

  it("incluye las habilidades al crear un empleado", async () => {
    mount({ ...empleado, id: undefined, habilidades: [] });
    fireEvent.click(await screen.findByRole("checkbox", { name: "Pintura" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar empleado" }));
    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith(
        "/empleados",
        expect.objectContaining({ habilidadesIds: [12] }),
      ),
    );
    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith({
        to: "/empleados/$empleadoId",
        params: { empleadoId: 41 },
      }),
    );
  });

  it("muestra errores del servidor sin anunciar éxito ni perder la selección", async () => {
    mocks.patch.mockRejectedValueOnce(
      new AxiosError("Bad request", "400", undefined, undefined, {
        data: { message: { habilidadesIds: ["La habilidad ya no existe."] } },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {} as never,
      }),
    );
    mount();
    await screen.findByRole("checkbox", { name: "Impermeabilización" });
    fireEvent.click(screen.getByRole("button", { name: "Guardar empleado" }));
    expect(await screen.findByText("La habilidad ya no existe.")).toBeTruthy();
    expect(mocks.success).not.toHaveBeenCalled();
    expect(
      screen.getByRole<HTMLInputElement>("checkbox", {
        name: "Impermeabilización",
      }).checked,
    ).toBe(true);
  });

  it("conserva la selección si falla el catálogo y permite reintentar", async () => {
    mocks.get.mockImplementation(async (url: string) => {
      if (url === "/catalogo-habilidades") throw new Error("Sin conexión");
      return { data: [empleado.cargo] };
    });
    mount();
    expect(
      await screen.findByText(/No se pudo cargar el catálogo/),
    ).toBeTruthy();
    expect(screen.getByText("1 habilidad seleccionada")).toBeTruthy();
    expect(
      screen.getByRole<HTMLButtonElement>("button", {
        name: "Quitar todas",
      }).disabled,
    ).toBe(true);
    mocks.get.mockResolvedValue({ data: habilidades });
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    const seleccionada = await screen.findByRole("checkbox", {
      name: "Impermeabilización",
    });
    expect((seleccionada as HTMLInputElement).checked).toBe(true);
  });

  it("informa cuando el catálogo está vacío", async () => {
    mocks.get.mockResolvedValue({ data: [] });
    mount({ ...empleado, habilidades: [] });
    expect(
      await screen.findByText(/No hay habilidades disponibles/),
    ).toBeTruthy();
  });
});
