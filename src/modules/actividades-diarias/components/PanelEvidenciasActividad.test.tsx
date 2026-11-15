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
import {
  ModalEvidenciasActividad,
  PanelEvidenciasActividad,
} from "./PanelEvidenciasActividad";

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

  it("abre un modal compacto para la cámara al tomar foto y agrega la captura a la vista previa", async () => {
    const stopTrack = vi.fn();
    const fakeStream = {
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(fakeStream);
    const originalMediaDevices = navigator.mediaDevices;
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () => ({ drawImage: vi.fn() }) as unknown as CanvasRenderingContext2D,
    ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) {
      cb(new Blob(["jpg"], { type: "image/jpeg" }));
    };

    try {
      renderPanel();

      fireEvent.click(screen.getByRole("button", { name: /Tomar foto/i }));

      expect(await screen.findByText("Tomar fotografía")).toBeTruthy();
      expect(getUserMedia).toHaveBeenCalledTimes(1);

      const btnCapturar = await screen.findByRole("button", {
        name: /Capturar foto/i,
      });
      await waitFor(() =>
        expect((btnCapturar as HTMLButtonElement).disabled).toBe(false),
      );
      fireEvent.click(btnCapturar);

      await waitFor(() =>
        expect(screen.queryByText("Tomar fotografía")).toBeNull(),
      );
      expect(stopTrack).toHaveBeenCalled();
      expect(screen.getByText("Vista previa antes de subir (1)")).toBeTruthy();
    } finally {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: originalMediaDevices,
      });
      HTMLCanvasElement.prototype.getContext = originalGetContext;
      HTMLCanvasElement.prototype.toBlob = originalToBlob;
    }
  });

  it("detiene las pistas de cámara si el usuario cancela antes de que getUserMedia resuelva", async () => {
    const stopTrack = vi.fn();
    let resolverStream!: (stream: MediaStream) => void;
    const getUserMedia = vi.fn(
      () =>
        new Promise<MediaStream>((resolve) => {
          resolverStream = resolve;
        }),
    );
    const originalMediaDevices = navigator.mediaDevices;

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });

    try {
      renderPanel();

      fireEvent.click(screen.getByRole("button", { name: /Tomar foto/i }));
      expect(await screen.findByText("Tomar fotografía")).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
      await waitFor(() =>
        expect(screen.queryByText("Tomar fotografía")).toBeNull(),
      );

      resolverStream({
        getTracks: () => [{ stop: stopTrack }],
      } as unknown as MediaStream);

      await waitFor(() => expect(stopTrack).toHaveBeenCalledTimes(1));
    } finally {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: originalMediaDevices,
      });
    }
  });

  it("mantiene montado el selector alternativo dentro del modal al cambiar de cámara a 'Usar archivo'", async () => {
    const stopTrack = vi.fn();
    const fakeStream = {
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(fakeStream);
    const originalMediaDevices = navigator.mediaDevices;

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);

    try {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      render(
        <QueryClientProvider client={queryClient}>
          <ModalEvidenciasActividad
            actividad={{
              id: 12,
              claveOperacion: "00000000-0000-4000-8000-000000000012",
              proyectoId: 10,
              usuarioId: 7,
              empleadoId: 7,
              fecha: "2026-11-15",
              nombre: "Impermeabilización losa",
              descripcion: "Avance",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              proyecto: {
                id: 10,
                nombre: "Edificio Central",
                estado: "ACTIVO",
              },
            }}
            onClose={vi.fn()}
          />
        </QueryClientProvider>,
      );

      fireEvent.click(screen.getByRole("button", { name: /Tomar foto/i }));
      expect(await screen.findByText("Tomar fotografía")).toBeTruthy();

      const inputCamaraAntes = screen.getByLabelText("Tomar foto con cámara");
      fireEvent.click(screen.getByRole("button", { name: /Usar archivo/i }));

      await waitFor(() =>
        expect(screen.getByText("Evidencias de actividad")).toBeTruthy(),
      );
      const inputCamaraDespues = screen.getByLabelText("Tomar foto con cámara");
      expect(inputCamaraDespues).toBe(inputCamaraAntes);

      const foto = new File(["jpg"], "respaldo.jpg", { type: "image/jpeg" });
      fireEvent.change(inputCamaraAntes, { target: { files: [foto] } });
      expect(screen.getByText("Vista previa antes de subir (1)")).toBeTruthy();
    } finally {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: originalMediaDevices,
      });
    }
  });
});
