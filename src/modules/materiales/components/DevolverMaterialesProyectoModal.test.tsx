import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DevolverMaterialesProyectoModal } from "./DevolverMaterialesProyectoModal";

const mocks = vi.hoisted(() => ({
  registrar: vi.fn(),
  success: vi.fn(),
  danger: vi.fn(),
}));

vi.mock("../api/inventario-materiales", () => ({
  registrarDevolucionMaterialesProyecto: mocks.registrar,
  errorMovimientoMaterial: () => "No se pudo registrar el movimiento.",
}));
vi.mock("@heroui/react/toast", () => ({
  toast: { success: mocks.success, danger: mocks.danger },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.registrar.mockResolvedValue({ movimientos: [], repetido: false });
});

describe("DevolverMaterialesProyectoModal", () => {
  it("muestra solo existencias positivas y devuelve varias cantidades", async () => {
    const onSuccess = vi.fn().mockResolvedValue(undefined);
    render(
      <DevolverMaterialesProyectoModal
        proyecto={{ id: 7, nombre: "Proyecto residencial" }}
        resumen={[
          {
            material: {
              id: 1,
              codigo: "CEM",
              nombre: "Cemento",
              unidad: "bolsa",
            },
            presupuestado: 5,
            entregado: 5,
            devuelto: 0,
            produccion: 0,
            merma: 0,
            cierre: 0,
            consumido: 0,
            existenciaActual: 5,
          },
          {
            material: {
              id: 2,
              codigo: "ARE",
              nombre: "Arena",
              unidad: "bolsa",
            },
            presupuestado: 3,
            entregado: 3,
            devuelto: 1,
            produccion: 2,
            merma: 0,
            cierre: 0,
            consumido: 2,
            existenciaActual: 0,
          },
          {
            material: {
              id: 3,
              codigo: "SEL",
              nombre: "Sellador",
              unidad: "galón",
            },
            presupuestado: 2,
            entregado: 2,
            devuelto: 0,
            produccion: 0,
            merma: 0,
            cierre: 0,
            consumido: 0,
            existenciaActual: 2,
          },
        ]}
        isOpen
        onOpenChange={vi.fn()}
        onSuccess={onSuccess}
      />,
    );

    const cemento = screen.getByLabelText("Cantidad a devolver de Cemento");
    const sellador = screen.getByLabelText("Cantidad a devolver de Sellador");
    expect(screen.queryByLabelText("Cantidad a devolver de Arena")).toBeNull();

    fireEvent.change(cemento, { target: { value: "2" } });
    fireEvent.change(sellador, { target: { value: "1" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Devolver materiales" }),
    );

    await waitFor(() => expect(mocks.registrar).toHaveBeenCalledOnce());
    expect(mocks.registrar).toHaveBeenCalledWith({
      proyectoId: 7,
      materiales: [
        expect.objectContaining({ materialId: 1, cantidad: 2 }),
        expect.objectContaining({ materialId: 3, cantidad: 1 }),
      ],
      observacion: undefined,
    });
    expect(onSuccess).toHaveBeenCalledOnce();
  });
});
