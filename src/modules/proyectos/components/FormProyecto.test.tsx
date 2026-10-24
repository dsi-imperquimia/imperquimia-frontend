import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormProyecto } from "./FormProyecto";
import type { ProyectoDetalle } from "../types/proyectos";

const mocks = vi.hoisted(() => ({
  guardar: vi.fn(),
  navigate: vi.fn(),
  success: vi.fn(),
  listarMateriales: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));
vi.mock("../api/guardarProyecto", () => ({
  guardarProyecto: mocks.guardar,
  errorProyecto: () => ({ campos: {}, general: "Error del servidor" }),
}));
vi.mock("@modules/materiales/api/list-materiales", () => ({
  listMateriales: mocks.listarMateriales,
}));
vi.mock("@heroui/react/toast", () => ({ toast: { success: mocks.success } }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listarMateriales.mockResolvedValue([
    {
      id: 1,
      nombre: "Cemento",
      unidad: "bolsa",
      costoUnitario: 10,
      estado: true,
    },
    { id: 2, nombre: "Arena", unidad: "m³", costoUnitario: 20, estado: true },
  ]);
});
afterEach(cleanup);

function mount(proyecto?: ProyectoDetalle) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <FormProyecto proyecto={proyecto} />
    </QueryClientProvider>,
  );
  if (!proyecto) {
    for (const [label, value] of [
      ["Nombre", "Obra prueba"],
      ["Cliente", "Cliente prueba"],
      ["Fecha de inicio", "2026-09-14"],
      ["Fecha de fin", "2026-09-30"],
    ]) {
      fireEvent.change(screen.getByLabelText(new RegExp(label)), {
        target: { value },
      });
    }
  }
}

describe("Materiales de proyectos", () => {
  it("exige un contacto antes de enviar", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Guardar proyecto" }));
    expect(screen.getByRole("alert").textContent).toContain(
      "teléfono o correo",
    );
    expect(mocks.guardar).not.toHaveBeenCalled();
  });

  it("crea con materiales, cantidades y contacto", async () => {
    mocks.guardar.mockResolvedValue({ id: 42 });
    mount();
    fireEvent.change(screen.getByLabelText("Correo"), {
      target: { value: "cliente@example.com" },
    });
    await waitFor(() =>
      expect(screen.queryByText("Cargando materiales…")).toBeNull(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Agregar material" }));
    await screen.findByRole("option", { name: "Cemento" });
    fireEvent.change(screen.getByLabelText("Material 1"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Cantidad del material 1"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar proyecto" }));
    await waitFor(() =>
      expect(mocks.guardar).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "cliente@example.com",
          detalles: [{ materialId: 1, cantidad: 2 }],
        }),
        undefined,
      ),
    );
    expect(mocks.navigate).toHaveBeenCalledWith({
      to: "/proyectos/$proyectoId",
      params: { proyectoId: "42" },
    });
  });

  it("rechaza cantidades no positivas", async () => {
    mount();
    fireEvent.change(screen.getByLabelText("Correo"), {
      target: { value: "cliente@example.com" },
    });
    await waitFor(() =>
      expect(screen.queryByText("Cargando materiales…")).toBeNull(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Agregar material" }));
    await screen.findByRole("option", { name: "Cemento" });
    fireEvent.change(screen.getByLabelText("Material 1"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Cantidad del material 1"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar proyecto" }));
    expect(mocks.guardar).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", {
        name: /Cantidad del material 1: Ingresa una cantidad mayor que cero/,
      }),
    ).toBeTruthy();
  });

  it("identifica la fila inválida y permite enfocar su cantidad", async () => {
    mount();
    fireEvent.change(screen.getByLabelText("Correo"), {
      target: { value: "cliente@example.com" },
    });
    await waitFor(() =>
      expect(screen.queryByText("Cargando materiales…")).toBeNull(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Agregar material" }));
    fireEvent.change(screen.getByLabelText("Material 1"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Agregar material" }));
    fireEvent.change(screen.getByLabelText("Material 2"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Cantidad del material 2"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar proyecto" }));
    expect(mocks.guardar).not.toHaveBeenCalled();
    const aviso = screen.getByRole("button", {
      name: /Cantidad del material 2: Ingresa una cantidad mayor que cero/,
    });
    fireEvent.click(aviso);
    expect(document.activeElement).toBe(
      screen.getByLabelText("Cantidad del material 2"),
    );
  });

  it("permite quitar un material existente al editar", async () => {
    mocks.guardar.mockResolvedValue({ id: 17 });
    mount({
      id: 17,
      nombre: "Obra",
      cliente: "Cliente",
      phone: "70000000",
      email: "",
      fechaInicio: "2026-09-14",
      fechaFin: "2026-09-30",
      estado: "ACTIVO",
      subTotal: "20",
      totalIva: "2.60",
      total: "22.60",
      herramientas: [],
      detalles: [
        {
          id: 5,
          material: { id: 1, nombre: "Cemento" },
          cantidad: "2",
          unidad: "bolsa",
          costoUnitario: "10",
          subTotal: "20",
          totalIva: "2.60",
          total: "22.60",
        },
      ],
    });
    fireEvent.click(screen.getByRole("button", { name: "Quitar" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar proyecto" }));
    await waitFor(() =>
      expect(mocks.guardar).toHaveBeenCalledWith(
        expect.objectContaining({ detalles: [] }),
        17,
      ),
    );
  });
});
