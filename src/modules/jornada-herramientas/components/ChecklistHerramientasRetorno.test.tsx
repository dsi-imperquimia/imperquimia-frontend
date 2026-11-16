import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JornadaHerramientas } from "../types/jornada-herramientas";
import { ChecklistHerramientasRetorno } from "./ChecklistHerramientasRetorno";

const mocks = vi.hoisted(() => ({
  verificarItemRetorno: vi.fn(),
  confirmarRetornoJornada: vi.fn(),
}));
vi.mock("../api/jornada-herramientas", async (original) => ({
  ...(await original<typeof import("../api/jornada-herramientas")>()),
  verificarItemRetorno: mocks.verificarItemRetorno,
  confirmarRetornoJornada: mocks.confirmarRetornoJornada,
}));

function jornada(
  overrides: Partial<JornadaHerramientas> = {},
): JornadaHerramientas {
  return {
    id: 1,
    claveOperacion: "00000000-0000-4000-8000-000000000110",
    proyectoId: 10,
    empleadoId: 3,
    fecha: "2026-11-15T00:00:00.000Z",
    verificacionInicioAt: "2026-11-15T13:00:00.000Z",
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
        estadoInicio: "VERIFICADA",
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
      <ChecklistHerramientasRetorno jornada={data} onCambio={onCambio} />
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

describe("ChecklistHerramientasRetorno (GPRCIMPER-110)", () => {
  it("sin verificación de inicio confirmada no permite conciliar el retorno", () => {
    renderChecklist(jornada({ verificacionInicioAt: null }));
    expect(
      screen.getByText(
        "Primero debes confirmar la verificación de inicio de esta jornada.",
      ),
    ).toBeDefined();
    expect(screen.queryByText("Confirmar retorno")).toBeNull();
  });

  it("confirmar el retorno de una herramienta llama a la API como VERIFICADA", async () => {
    mocks.verificarItemRetorno.mockResolvedValue(jornada());
    renderChecklist(jornada());

    fireEvent.click(screen.getByText("Confirmar retorno"));

    await waitFor(() =>
      expect(mocks.verificarItemRetorno).toHaveBeenCalledWith(
        1,
        100,
        "VERIFICADA",
        "",
      ),
    );
  });

  it("CA2: reportar una herramienta no retornada exige observación de incidencia", async () => {
    renderChecklist(jornada());

    fireEvent.click(screen.getByText("No retornó"));
    fireEvent.click(screen.getByText("Reportar incidencia"));

    expect(
      await screen.findByText(
        "Indica una observación al reportar la herramienta como no retornada.",
      ),
    ).toBeDefined();
    expect(mocks.verificarItemRetorno).not.toHaveBeenCalled();

    fireEvent.change(
      screen.getByPlaceholderText(
        "Describe la incidencia: por qué no retornó la herramienta",
      ),
      { target: { value: "Quedó olvidada en obra" } },
    );
    mocks.verificarItemRetorno.mockResolvedValue(jornada());
    fireEvent.click(screen.getByText("Reportar incidencia"));

    await waitFor(() =>
      expect(mocks.verificarItemRetorno).toHaveBeenCalledWith(
        1,
        100,
        "AUSENTE",
        "Quedó olvidada en obra",
      ),
    );
  });

  it("muestra la incidencia generada para una herramienta ausente", () => {
    const data = jornada();
    data.items[0].estadoRetorno = "AUSENTE";
    data.items[0].observacionRetorno = "Quedó olvidada en obra";
    data.items[0].incidenciaId = 55;
    data.items[0].incidencia = {
      id: 55,
      titulo: "Herramienta no retornada: Taladro (HERR-0001)",
      estado: "ABIERTA",
    };
    renderChecklist(data);

    expect(
      screen.getByText(
        "Incidencia generada: Herramienta no retornada: Taladro (HERR-0001)",
      ),
    ).toBeDefined();
  });

  it("CA3: con el retorno confirmado indica que las herramientas quedaron disponibles", () => {
    renderChecklist(
      jornada({ verificacionRetornoAt: "2026-11-15T23:00:00.000Z" }),
    );
    expect(
      screen.getByText(
        "Retorno confirmado. Las herramientas verificadas quedaron disponibles en bodega.",
      ),
    ).toBeDefined();
    expect(screen.queryByText("Confirmar retorno de la jornada")).toBeNull();
  });
});
