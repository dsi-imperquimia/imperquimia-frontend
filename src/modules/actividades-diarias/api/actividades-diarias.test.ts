import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorActividadDiaria, esErrorDeConexion } from "./actividades-diarias";
import {
  eliminarBorradorActividad,
  guardarBorradorActividad,
  listarBorradoresActividad,
  obtenerClaveStorageBorradores,
  reenviarBorradoresActividad,
} from "./borradores-actividad";
import type { BorradorActividad } from "../types/actividad-diaria";

const uuid1 = "00000000-0000-4000-8000-000000000101";
const uuid2 = "00000000-0000-4000-8000-000000000102";

function crearBorrador(claveOperacion = uuid1): BorradorActividad {
  return {
    claveOperacion,
    payload: {
      claveOperacion,
      proyectoId: 10,
      fecha: "2026-11-14",
      descripcion: "Aplicación de sellador en junta de dilatación",
    },
    proyectoNombre: "Torre Norte",
    guardadoEn: "2026-11-14T12:00:00.000Z",
  };
}

function crearAxiosErrorConStatus(status: number, message: unknown) {
  return new AxiosError(
    "Request failed",
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    {
      status,
      statusText: "Error",
      headers: {},
      config: {} as any,
      data: { message },
    },
  );
}

describe("esErrorDeConexion y errorActividadDiaria", () => {
  it("detecta un error de red sin respuesta como error de conexión", () => {
    const networkError = new AxiosError("Network Error", "ERR_NETWORK");
    expect(esErrorDeConexion(networkError)).toBe(true);
  });

  it("detecta errores 503 como error de conexión y 400 como error de validación", () => {
    expect(
      esErrorDeConexion(crearAxiosErrorConStatus(503, "Unavailable")),
    ).toBe(true);
    expect(
      esErrorDeConexion(
        crearAxiosErrorConStatus(400, {
          descripcion: ["Ingresa la descripción de la actividad."],
        }),
      ),
    ).toBe(false);
  });

  it("extrae errores por campo enviados por el backend", () => {
    const detalle = errorActividadDiaria(
      crearAxiosErrorConStatus(400, {
        fecha: ["La fecha no puede ser futura."],
      }),
    );
    expect(detalle.campos.fecha).toBe("La fecha no puede ser futura.");
    expect(detalle.general).toBe("La fecha no puede ser futura.");
  });
});

describe("borradores de actividad en localStorage", () => {
  const userId = 42;
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
        clear: () => {
          store.clear();
        },
      },
    });
  });

  it("guarda sin duplicar por claveOperacion y elimina la clave de localStorage al quedar vacío", () => {
    guardarBorradorActividad(userId, crearBorrador(uuid1));
    guardarBorradorActividad(userId, {
      ...crearBorrador(uuid1),
      proyectoNombre: "Torre Norte Actualizada",
    });

    const guardados = listarBorradoresActividad(userId);
    expect(guardados).toHaveLength(1);
    expect(guardados[0]?.proyectoNombre).toBe("Torre Norte Actualizada");

    eliminarBorradorActividad(userId, uuid1);
    expect(listarBorradoresActividad(userId)).toEqual([]);
    expect(
      window.localStorage.getItem(obtenerClaveStorageBorradores(userId)),
    ).toBeNull();
  });

  it("elimina del localStorage los borradores reenviados con éxito", async () => {
    guardarBorradorActividad(userId, crearBorrador(uuid1));
    guardarBorradorActividad(userId, crearBorrador(uuid2));

    const enviarMock = vi.fn().mockResolvedValue({
      actividad: { id: 1 },
      repetido: false,
    });

    const resultado = await reenviarBorradoresActividad(userId, enviarMock);

    expect(resultado.enviados).toBe(2);
    expect(resultado.pendientes).toHaveLength(0);
    expect(
      window.localStorage.getItem(obtenerClaveStorageBorradores(userId)),
    ).toBeNull();
  });

  it("conserva el borrador si persiste el error de conexión y registra ultimoError ante un 400", async () => {
    guardarBorradorActividad(userId, crearBorrador(uuid1));
    const enviarRed = vi
      .fn()
      .mockRejectedValue(new AxiosError("Network Error", "ERR_NETWORK"));

    const falloRed = await reenviarBorradoresActividad(userId, enviarRed);
    expect(falloRed.detenidoPorConexion).toBe(true);
    expect(falloRed.pendientes).toHaveLength(1);

    const enviar400 = vi
      .fn()
      .mockRejectedValue(
        crearAxiosErrorConStatus(400, "Solo se pueden registrar en activos."),
      );
    const falloValidacion = await reenviarBorradoresActividad(
      userId,
      enviar400,
    );
    expect(falloValidacion.detenidoPorConexion).toBe(false);
    expect(falloValidacion.pendientes[0]?.ultimoError).toBe(
      "Solo se pueden registrar en activos.",
    );
  });
});
