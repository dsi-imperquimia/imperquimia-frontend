import { http } from "@lib/http";
import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  errorConsumoMaterial,
  getConsumosProyecto,
  registrarConsumoMaterial,
} from "./consumos-materiales";

vi.mock("@lib/http", () => ({
  http: { get: vi.fn(), post: vi.fn() },
}));

describe("API de consumos de materiales", () => {
  beforeEach(() => vi.clearAllMocks());

  it("consulta el proyecto explícito sin seleccionar otro automáticamente", async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: { resumen: [], consumos: [] },
    });
    await getConsumosProyecto(17);
    expect(http.get).toHaveBeenCalledWith("/consumos-materiales?proyectoId=17");
  });

  it("envía la clasificación y la clave idempotente", async () => {
    vi.mocked(http.post).mockResolvedValue({ data: { repetido: false } });
    const payload = {
      claveOperacion: "00000000-0000-4000-8000-000000000001",
      proyectoId: 17,
      materialId: 3,
      cantidad: 1.5,
      clasificacion: "PERDIDA" as const,
      fechaJornada: "2026-11-12",
      motivo: "Material endurecido",
    };
    await registrarConsumoMaterial(payload);
    expect(http.post).toHaveBeenCalledWith("/consumos-materiales", payload);
  });

  it("muestra el conflicto de saldo devuelto por la API", () => {
    const error = new AxiosError("conflicto", "409", undefined, undefined, {
      data: {
        message:
          "La cantidad supera el saldo disponible del proyecto. Actualmente hay 2 unidades disponibles.",
      },
      status: 409,
      statusText: "Conflict",
      headers: {},
      config: { headers: {} } as never,
    });
    expect(errorConsumoMaterial(error)).toContain(
      "Actualmente hay 2 unidades disponibles",
    );
  });
});
