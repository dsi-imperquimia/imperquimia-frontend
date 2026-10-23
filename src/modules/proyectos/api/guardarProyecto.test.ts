import { describe, expect, it } from "vitest";
import { errorProyecto } from "./guardarProyecto";

describe("Errores del proyecto", () => {
  it("asocia un error anidado a la fila y campo del material", () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          message: {
            "detalles.1.cantidad": ["La cantidad debe ser mayor a cero."],
            cantidad: ["La cantidad debe ser mayor a cero."],
          },
        },
      },
    };

    expect(errorProyecto(error)).toEqual({
      campos: { "detalles.1.cantidad": "La cantidad debe ser mayor a cero." },
    });
  });
});
