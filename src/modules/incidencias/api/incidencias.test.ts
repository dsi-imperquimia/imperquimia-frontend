import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { construirParamsIncidencias, errorIncidencia } from "./incidencias";

function axiosError(message: unknown) {
  return new AxiosError(
    "Request failed",
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    {
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: {} as never,
      data: { message },
    },
  );
}

describe("construirParamsIncidencias", () => {
  it("solo incluye los filtros con valor", () => {
    const params = construirParamsIncidencias({
      proyectoId: 4,
      estado: "ABIERTA",
      prioridad: "",
      actividadDiariaId: null,
    });
    expect(params.toString()).toBe("proyectoId=4&estado=ABIERTA");
  });

  it("devuelve una cadena vacía sin filtros", () => {
    expect(construirParamsIncidencias().toString()).toBe("");
  });
});

describe("errorIncidencia", () => {
  it("extrae el error por campo enviado por el backend", () => {
    const detalle = errorIncidencia(
      axiosError({ titulo: ["Ingresa el título de la incidencia."] }),
    );
    expect(detalle.campos.titulo).toBe("Ingresa el título de la incidencia.");
    expect(detalle.general).toBe("Ingresa el título de la incidencia.");
  });

  it("usa el mensaje de texto cuando no hay campos", () => {
    const detalle = errorIncidencia(
      axiosError("La incidencia ya se encuentra en ese estado."),
    );
    expect(detalle.campos).toEqual({});
    expect(detalle.general).toBe(
      "La incidencia ya se encuentra en ese estado.",
    );
  });

  it("toma el primer mensaje de un arreglo de class-validator", () => {
    const detalle = errorIncidencia(
      axiosError(["La prioridad debe ser BAJA."]),
    );
    expect(detalle.general).toBe("La prioridad debe ser BAJA.");
  });

  it("devuelve un mensaje genérico ante errores desconocidos", () => {
    expect(errorIncidencia(new Error("boom")).general).toMatch(
      /No se pudo completar/,
    );
  });
});
