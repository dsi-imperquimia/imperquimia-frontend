import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { AxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JornadaHerramientas } from "../types/jornada-herramientas";
import { ChecklistHerramientasInicio } from "./ChecklistHerramientasInicio";

const mocks = vi.hoisted(() => ({
  verificarItemInicio: vi.fn(),
  confirmarInicioJornada: vi.fn(),
}));
vi.mock("../api/jornada-herramientas", async (original) => ({
  ...(await original<typeof import("../api/jornada-herramientas")>()),
  verificarItemInicio: mocks.verificarItemInicio,
  confirmarInicioJornada: mocks.confirmarInicioJornada,
}));

function jornada(
  overrides: Partial<JornadaHerramientas> = {},
): JornadaHerramientas {
  return {
    id: 1,
    claveOperacion: "00000000-0000-4000-8000-000000000108",
    proyectoId: 10,
    empleadoId: 3,
    fecha: "2026-11-15T00:00:00.000Z",
    verificacionInicioAt: null,
    verificacionRetornoAt: null,
    proyecto: { id: 10, nombre: "Torre Norte", estado: "ACTIVO" },
    empleado: { id: 3, nombreCompleto: "José Pérez" },
    items: [
      {
        id: 100,
        herramientaId: 1,
        herramienta: {
          id: 1,
          codigoUnico: "HERR-0001",
          nombre: "Taladro",
          estado: "EN_PROYECTO",
        },
        estadoInicio: "PENDIENTE",
        observacionInicio: null,
        estadoRetorno: "PENDIENTE",
        observacionRetorno: null,
        incidenciaId: null,
      },
      {
        id: 101,
        herramientaId: 2,
        herramienta: {
          id: 2,
          codigoUnico: "HERR-0002",
          nombre: "Sierra",
          estado: "EN_PROYECTO",
        },
        estadoInicio: "PENDIENTE",
        observacionInicio: null,
        estadoRetorno: "PENDIENTE",
        observacionRetorno: null,
        incidenciaId: null,
      },
    ],
    ...overrides,
  };
}

function renderChecklist(data: JornadaHerramientas, onCambio = vi.fn()) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ChecklistHerramientasInicio jornada={data} onCambio={onCambio} />
    </QueryClientProvider>,
  );
  return onCambio;
}

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
});

describe("ChecklistHerramientasInicio (GPRCIMPER-108)", () => {
  it("lista las herramientas despachadas con acciones de verificación", () => {
    renderChecklist(jornada());
    expect(screen.getByText("Taladro")).toBeDefined();
    expect(screen.getByText("Sierra")).toBeDefined();
    expect(screen.getAllByText("Verificar")).toHaveLength(2);
    expect(screen.getAllByText("Marcar ausente")).toHaveLength(2);
  });

  it("marca una herramienta como verificada sin pedir observación", async () => {
    const actualizada = jornada();
    actualizada.items[0].estadoInicio = "VERIFICADA";
    mocks.verificarItemInicio.mockResolvedValue(actualizada);
    const onCambio = renderChecklist(jornada());

    fireEvent.click(screen.getAllByText("Verificar")[0]);

    await waitFor(() =>
      expect(mocks.verificarItemInicio).toHaveBeenCalledWith(
        1,
        100,
        "VERIFICADA",
        "",
      ),
    );
    expect(onCambio).toHaveBeenCalledWith(actualizada);
  });

  it("exige observación antes de confirmar una ausencia", async () => {
    renderChecklist(jornada());

    fireEvent.click(screen.getAllByText("Marcar ausente")[0]);
    fireEvent.click(screen.getByText("Confirmar ausencia"));

    expect(
      await screen.findByText(
        "Indica una observación al marcar la herramienta como ausente.",
      ),
    ).toBeDefined();
    expect(mocks.verificarItemInicio).not.toHaveBeenCalled();

    fireEvent.change(
      screen.getByPlaceholderText(
        "Describe por qué no está presente la herramienta",
      ),
      { target: { value: "No estaba en el camión" } },
    );
    mocks.verificarItemInicio.mockResolvedValue(jornada());
    fireEvent.click(screen.getByText("Confirmar ausencia"));

    await waitFor(() =>
      expect(mocks.verificarItemInicio).toHaveBeenCalledWith(
        1,
        100,
        "AUSENTE",
        "No estaba en el camión",
      ),
    );
  });

  it("CA3: al confirmar con pendientes muestra la alerta con las herramientas faltantes", async () => {
    mocks.confirmarInicioJornada.mockRejectedValue(
      new AxiosError("Bad Request", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 400,
        data: {
          message:
            "Hay herramientas sin verificar ni marcar como ausentes. Revisa el checklist antes de cerrar la verificación.",
          herramientasPendientes: [
            { itemId: 101, herramientaId: 2, codigoUnico: "HERR-0002", nombre: "Sierra" },
          ],
        },
      } as never),
    );
    renderChecklist(jornada());

    fireEvent.click(screen.getByText("Confirmar verificación de inicio"));

    expect(
      await screen.findByText(
        "Hay herramientas sin verificar ni marcar como ausentes. Revisa el checklist antes de cerrar la verificación.",
      ),
    ).toBeDefined();
    expect(screen.getByText("Sierra (HERR-0002)")).toBeDefined();
  });

  it("con la verificación confirmada bloquea las acciones y lo indica", () => {
    renderChecklist(
      jornada({ verificacionInicioAt: "2026-11-15T13:00:00.000Z" }),
    );
    expect(screen.getByText("Verificación de inicio confirmada.")).toBeDefined();
    expect(screen.queryByText("Verificar")).toBeNull();
    expect(screen.queryByText("Confirmar verificación de inicio")).toBeNull();
  });
});
