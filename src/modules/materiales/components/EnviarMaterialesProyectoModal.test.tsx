import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnviarMaterialesProyectoModal } from "./EnviarMaterialesProyectoModal";

const mocks = vi.hoisted(() => ({
  listarMateriales: vi.fn(),
  listarExistencias: vi.fn(),
  registrar: vi.fn(),
  success: vi.fn(),
}));

vi.mock("../api/list-materiales", () => ({
  listMateriales: mocks.listarMateriales,
}));
vi.mock("../api/inventario-materiales", () => ({
  listExistenciasMateriales: mocks.listarExistencias,
  registrarSalidaMaterialesProyecto: mocks.registrar,
  errorMovimientoMaterial: () => "No se pudo registrar el movimiento.",
}));
vi.mock("@heroui/react/toast", () => ({
  toast: { success: mocks.success },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listarMateriales.mockResolvedValue([
    {
      id: 1,
      codigo: "CEM",
      nombre: "Cemento",
      descripcion: "",
      unidad: "bolsa",
      costoUnitario: 10,
      estado: true,
    },
    {
      id: 2,
      codigo: "ARE",
      nombre: "Arena",
      descripcion: "",
      unidad: "m³",
      costoUnitario: 20,
      estado: true,
    },
  ]);
  mocks.listarExistencias.mockResolvedValue([
    {
      id: 1,
      cantidad: 10,
      material: {
        id: 1,
        codigo: "CEM",
        nombre: "Cemento",
        unidad: "bolsa",
        estado: true,
      },
      ubicacion: {
        id: 1,
        codigo: "BODEGA-GENERAL",
        nombre: "Bodega general",
        tipo: "BODEGA",
        proyectoId: null,
      },
    },
    {
      id: 2,
      cantidad: 8,
      material: {
        id: 2,
        codigo: "ARE",
        nombre: "Arena",
        unidad: "m³",
        estado: true,
      },
      ubicacion: {
        id: 1,
        codigo: "BODEGA-GENERAL",
        nombre: "Bodega general",
        tipo: "BODEGA",
        proyectoId: null,
      },
    },
  ]);
  mocks.registrar.mockResolvedValue({ movimientos: [], repetido: false });
});

describe("EnviarMaterialesProyectoModal", () => {
  it("precarga lo cotizado en cero y solo envía cantidades positivas", async () => {
    const onSuccess = vi.fn().mockResolvedValue(undefined);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EnviarMaterialesProyectoModal
          proyecto={{
            id: 7,
            nombre: "Proyecto residencial",
            detalles: [
              {
                id: 11,
                material: { id: 1, nombre: "Cemento" },
                cantidad: 5,
                unidad: "bolsa",
                costoUnitario: 10,
                subTotal: 50,
                totalIva: 6.5,
                total: 56.5,
              },
              {
                id: 12,
                material: { id: 2, nombre: "Arena" },
                cantidad: 3,
                unidad: "m³",
                costoUnitario: 20,
                subTotal: 60,
                totalIva: 7.8,
                total: 67.8,
              },
            ],
          }}
          isOpen
          onOpenChange={vi.fn()}
          onSuccess={onSuccess}
        />
      </QueryClientProvider>,
    );

    const cemento = await screen.findByLabelText("Cantidad de Cemento");
    const arena = screen.getByLabelText("Cantidad de Arena");
    expect((cemento as HTMLInputElement).value).toBe("0");
    expect((arena as HTMLInputElement).value).toBe("0");

    fireEvent.change(arena, { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar materiales" }));

    await waitFor(() => expect(mocks.registrar).toHaveBeenCalledOnce());
    expect(mocks.registrar).toHaveBeenCalledWith({
      proyectoId: 7,
      materiales: [expect.objectContaining({ materialId: 2, cantidad: 2 })],
      observacion: undefined,
    });
    expect(onSuccess).toHaveBeenCalledOnce();
  });
});
