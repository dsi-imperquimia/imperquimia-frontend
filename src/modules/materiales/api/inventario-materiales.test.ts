import { describe, expect, it } from "vitest";
import { errorMovimientoMaterial } from "./inventario-materiales";

function axiosError(message: unknown) {
  return {
    isAxiosError: true,
    response: { data: { message } },
  };
}

describe("errorMovimientoMaterial", () => {
  it("muestra el mensaje enviado por el backend", () => {
    expect(
      errorMovimientoMaterial(axiosError("Existencia insuficiente en bodega")),
    ).toBe("Existencia insuficiente en bodega");
  });

  it("muestra el primer error de validación", () => {
    expect(
      errorMovimientoMaterial(
        axiosError({ cantidad: ["La cantidad debe ser mayor que cero"] }),
      ),
    ).toBe("La cantidad debe ser mayor que cero");
  });

  it("usa un mensaje seguro ante un error desconocido", () => {
    expect(errorMovimientoMaterial(new Error("fallo de red"))).toBe(
      "No se pudo registrar el movimiento. Inténtalo de nuevo.",
    );
  });
});
