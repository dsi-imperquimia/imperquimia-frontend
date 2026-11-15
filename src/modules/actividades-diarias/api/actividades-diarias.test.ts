import { http } from "@lib/http";
import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  errorActividadDiaria,
  esErrorDeConexion,
  exportarActividadesDiarias,
  listActividadesDiarias,
  subirEvidenciasActividad,
} from "./actividades-diarias";
import {
  eliminarBorradorActividad,
  guardarBorradorActividad,
  listarBorradoresActividad,
  obtenerClaveStorageBorradores,
  reenviarBorradoresActividad,
} from "./borradores-actividad";
import {
  restarDiasIso,
  type BorradorActividad,
} from "../types/actividad-diaria";

const uuid1 = "00000000-0000-4000-8000-000000000101";
const uuid2 = "00000000-0000-4000-8000-000000000102";

function crearBorrador(claveOperacion = uuid1): BorradorActividad {
  return {
    claveOperacion,
    payload: {
      claveOperacion,
      proyectoId: 10,
      fecha: "2026-11-14",
      nombre: "Sellado de junta de dilatación",
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

describe("listActividadesDiarias y exportarActividadesDiarias (GPRIMPER-43)", () => {
  it("calcula fechas relativas restando días locales sin perder cambios de mes", () => {
    expect(restarDiasIso(7, "2026-11-14")).toBe("2026-11-07");
    expect(restarDiasIso(7, "2026-03-03")).toBe("2026-02-24");
  });

  it("serializa proyectoId, fechaInicio y fechaFin al consultar actividades", async () => {
    const spyGet = vi.spyOn(http, "get").mockResolvedValueOnce({ data: [] });

    await listActividadesDiarias({
      proyectoId: 10,
      fechaInicio: "2026-11-07",
      fechaFin: "2026-11-14",
    });

    expect(spyGet).toHaveBeenCalledWith(
      "/actividades-diarias?proyectoId=10&fechaInicio=2026-11-07&fechaFin=2026-11-14",
    );
    spyGet.mockRestore();
  });

  it("descarga PDF o Excel respetando filtros y extrae nombre de archivo", async () => {
    const pdfBlob = new Blob(["%PDF-1.7"], { type: "application/pdf" });
    const spyGet = vi.spyOn(http, "get").mockResolvedValueOnce({
      data: pdfBlob,
      headers: {
        "content-disposition":
          'attachment; filename="actividades-diarias-2026-11-07_a_2026-11-14.pdf"',
      },
    });

    const resultado = await exportarActividadesDiarias("pdf", {
      fechaInicio: "2026-11-07",
      fechaFin: "2026-11-14",
    });

    expect(spyGet).toHaveBeenCalledWith(
      "/actividades-diarias/exportar?fechaInicio=2026-11-07&fechaFin=2026-11-14&formato=pdf",
      { responseType: "blob" },
    );
    expect(resultado.blob).toBe(pdfBlob);
    expect(resultado.filename).toBe(
      "actividades-diarias-2026-11-07_a_2026-11-14.pdf",
    );
    spyGet.mockRestore();
  });

  it("decodifica errores JSON devueltos como Blob cuando falla la exportación", async () => {
    const errorBlob = new Blob(
      [JSON.stringify({ message: "La fecha de inicio es inválida." })],
      { type: "application/json" },
    );
    const spyGet = vi.spyOn(http, "get").mockRejectedValueOnce(
      new AxiosError("Bad Request", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {} as any,
        data: errorBlob,
      }),
    );

    try {
      await exportarActividadesDiarias("excel");
      expect.unreachable();
    } catch (error) {
      expect(errorActividadDiaria(error).general).toBe(
        "La fecha de inicio es inválida.",
      );
    } finally {
      spyGet.mockRestore();
    }
  });

  it("sube múltiples evidencias en FormData reportando progreso (GPRIMPER-53)", async () => {
    const spyPost = vi
      .spyOn(http, "post")
      .mockImplementation(async (_url, body, config) => {
        expect(body).toBeInstanceOf(FormData);
        const files = (body as FormData).getAll("archivos");
        expect(files).toHaveLength(2);
        expect(config?.headers?.["Content-Type"]).toBeUndefined();
        config?.onUploadProgress?.({ loaded: 5, total: 10 } as any);
        return { data: [{ id: 1 }, { id: 2 }] };
      });

    const progresos: number[] = [];
    const archivo1 = new File(["12345"], "uno.jpg", { type: "image/jpeg" });
    const archivo2 = new File(["67890"], "dos.png", { type: "image/png" });

    const res = await subirEvidenciasActividad(
      12,
      [archivo1, archivo2],
      (pct) => {
        progresos.push(pct);
      },
    );

    expect(spyPost).toHaveBeenCalledWith(
      "/actividades-diarias/12/evidencias",
      expect.any(FormData),
      expect.objectContaining({
        headers: { "Content-Type": undefined },
      }),
    );
    expect(progresos).toEqual([50, 100]);
    expect(res).toHaveLength(2);
    spyPost.mockRestore();
  });
});
