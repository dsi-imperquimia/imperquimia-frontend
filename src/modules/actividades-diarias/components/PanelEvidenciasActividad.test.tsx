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
import { PanelEvidenciasActividad } from "./PanelEvidenciasActividad";

const mocks = vi.hoisted(() => ({
  listarEvidencias: vi.fn(),
  subirEvidencias: vi.fn(),
  obtenerBlobUrl: vi.fn(),
  eliminarEvidencia: vi.fn(),
}));

vi.mock("../api/actividades-diarias", async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal();
  return {
    ...actual,
    listEvidenciasActividad: mocks.listarEvidencias,
    subirEvidenciasActividad: mocks.subirEvidencias,
    obtenerImagenEvidenciaUrlBlob: mocks.obtenerBlobUrl,
    eliminarEvidenciaActividad: mocks.eliminarEvidencia,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  let seq = 0;
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => `blob:preview-${++seq}`),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
  mocks.listarEvidencias.mockResolvedValue([]);
  mocks.obtenerBlobUrl.mockResolvedValue("blob:guardada-1");
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

function renderPanel() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PanelEvidenciasActividad
        actividadId={12}
        actividadNombre="Impermeabilización losa"
      />
    </QueryClientProvider>,
  );
}

describe("PanelEvidenciasActividad (GPRIMPER-53)", () => {
  it("muestra opciones de cámara y galería y previsualiza múltiples imágenes antes de confirmar", async () => {
    renderPanel();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Tomar foto/i })).toBeTruthy(),
    );
    expect(
      screen.getByRole("button", { name: /Elegir de la galería/i }),
    ).toBeTruthy();

    const inputCamara = screen.getByLabelText(
      "Tomar foto con cámara",
    ) as HTMLInputElement;
    expect(inputCamara.getAttribute("capture")).toBe("environment");

    const fotoCamara = new File(["jpgdata"], "foto-campo.jpg", {
      type: "image/jpeg",
    });
    fireEvent.change(inputCamara, { target: { files: [fotoCamara] } });

    const inputGaleria = screen.getByLabelText(
      "Elegir imágenes de la galería",
    ) as HTMLInputElement;
    expect(inputGaleria.multiple).toBe(true);

    const imgGaleria = new File(["pngdata"], "detalle-techo.png", {
      type: "image/png",
    });
    fireEvent.change(inputGaleria, { target: { files: [imgGaleria] } });

    expect(screen.getByText("Vista previa antes de subir (2)")).toBeTruthy();
    expect(screen.getByAltText("Vista previa de foto-campo.jpg")).toBeTruthy();
    expect(
      screen.getByAltText("Vista previa de detalle-techo.png"),
    ).toBeTruthy();
    expect(mocks.subirEvidencias).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText("Quitar foto-campo.jpg"));
    expect(screen.getByText("Vista previa antes de subir (1)")).toBeTruthy();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it("muestra barra de progreso durante la subida y mensaje de éxito al finalizar", async () => {
    let resolverSubida!: (valor: unknown[]) => void;
    let reportarProgreso: ((pct: number) => void) | undefined;
    mocks.subirEvidencias.mockImplementation(
      (_id: number, _archivos: File[], onProgress?: (pct: number) => void) => {
        reportarProgreso = onProgress;
        return new Promise((resolve) => {
          resolverSubida = resolve;
        });
      },
    );

    renderPanel();

    const inputGaleria = screen.getByLabelText("Elegir imágenes de la galería");
    const img1 = new File(["a"], "evidencia-1.jpg", { type: "image/jpeg" });
    const img2 = new File(["b"], "evidencia-2.png", { type: "image/png" });
    fireEvent.change(inputGaleria, { target: { files: [img1, img2] } });

    fireEvent.click(
      screen.getByRole("button", { name: /Confirmar subida \(2\)/i }),
    );

    await waitFor(() => expect(screen.getByRole("progressbar")).toBeTruthy());
    reportarProgreso?.(45);

    await waitFor(() =>
      expect(
        screen.getByRole("progressbar").getAttribute("aria-valuenow"),
      ).toBe("45"),
    );
    expect(screen.getByText("45%")).toBeTruthy();

    mocks.listarEvidencias.mockResolvedValue([
      {
        id: 1,
        actividadDiariaId: 12,
        nombreOriginal: "evidencia-1.jpg",
        mimeType: "image/jpeg",
        tamanoBytes: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        actividadDiariaId: 12,
        nombreOriginal: "evidencia-2.png",
        mimeType: "image/png",
        tamanoBytes: 1,
        createdAt: new Date().toISOString(),
      },
    ]);

    resolverSubida([
      {
        id: 1,
        actividadDiariaId: 12,
        nombreOriginal: "evidencia-1.jpg",
        mimeType: "image/jpeg",
        tamanoBytes: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        actividadDiariaId: 12,
        nombreOriginal: "evidencia-2.png",
        mimeType: "image/png",
        tamanoBytes: 1,
        createdAt: new Date().toISOString(),
      },
    ]);

    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain(
        "Se subieron 2 imágenes con éxito.",
      ),
    );
    await waitFor(() =>
      expect(screen.getByText("Imágenes adjuntas (2)")).toBeTruthy(),
    );
  });

  it("muestra mensaje de error al fallar la subida o elegir un archivo no válido", async () => {
    mocks.subirEvidencias.mockRejectedValueOnce(
      new AxiosError("Bad Request", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {} as any,
        data: { message: "Formato no compatible." },
      }),
    );

    renderPanel();

    const inputGaleria = screen.getByLabelText("Elegir imágenes de la galería");
    const pdfInvalido = new File(["%PDF"], "archivo.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(inputGaleria, { target: { files: [pdfInvalido] } });

    expect(screen.getByRole("alert").textContent).toContain(
      "formato no compatible",
    );

    const imgValida = new File(["img"], "fachada.jpg", { type: "image/jpeg" });
    fireEvent.change(inputGaleria, { target: { files: [imgValida] } });
    fireEvent.click(
      screen.getByRole("button", { name: /Confirmar subida \(1\)/i }),
    );

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe(
        "Formato no compatible.",
      ),
    );
    expect(screen.getByText("Vista previa antes de subir (1)")).toBeTruthy();
  });
});
