import { Button } from "@heroui/react/button";
import { Modal } from "@heroui/react/modal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Camera, ImagePlus, Trash2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  eliminarEvidenciaActividad,
  errorActividadDiaria,
  listEvidenciasActividad,
  obtenerImagenEvidenciaUrlBlob,
  subirEvidenciasActividad,
} from "../api/actividades-diarias";
import {
  MAX_ARCHIVOS_EVIDENCIA,
  MAX_TAMANO_IMAGEN_BYTES,
  TIPOS_IMAGEN_PERMITIDOS,
  formatearTamanoArchivo,
  type ActividadDiaria,
  type EvidenciaActividadDiaria,
} from "../types/actividad-diaria";

interface ImagenPendiente {
  idLocal: string;
  file: File;
  previewUrl: string;
}

function esImagenValida(archivo: File): boolean {
  const mime = archivo.type.toLowerCase();
  if (TIPOS_IMAGEN_PERMITIDOS.has(mime)) return true;
  if (!mime && /\.(jpe?g|png|webp)$/i.test(archivo.name)) return true;
  return false;
}

function MiniaturaEvidenciaGuardada({
  actividadId,
  evidencia,
  soloLectura,
  eliminando,
  onEliminar,
}: {
  actividadId: number;
  evidencia: EvidenciaActividadDiaria;
  soloLectura: boolean;
  eliminando: boolean;
  onEliminar: (evidenciaId: number) => void;
}) {
  const [urlImagen, setUrlImagen] = useState<string | null>(null);
  const [errorCarga, setErrorCarga] = useState(false);

  useEffect(() => {
    let cancelado = false;
    let urlCreada: string | null = null;
    setErrorCarga(false);

    void obtenerImagenEvidenciaUrlBlob(actividadId, evidencia.id)
      .then((blobUrl) => {
        if (cancelado) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        urlCreada = blobUrl;
        setUrlImagen(blobUrl);
      })
      .catch(() => {
        if (!cancelado) setErrorCarga(true);
      });

    return () => {
      cancelado = true;
      if (urlCreada) URL.revokeObjectURL(urlCreada);
    };
  }, [actividadId, evidencia.id]);

  return (
    <div className="flex flex-col justify-between rounded-lg border border-gray-200 bg-gray-50 p-2">
      <div className="mb-2 flex h-32 items-center justify-center overflow-hidden rounded-md bg-gray-100">
        {urlImagen ? (
          <img
            src={urlImagen}
            alt={evidencia.nombreOriginal}
            className="h-full w-full object-cover"
          />
        ) : errorCarga ? (
          <span className="px-2 text-center text-xs text-red-600">
            No se pudo cargar la imagen
          </span>
        ) : (
          <span className="text-xs text-gray-500">Cargando…</span>
        )}
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className="truncate text-xs font-medium text-gray-800"
            title={evidencia.nombreOriginal}
          >
            {evidencia.nombreOriginal}
          </p>
          <p className="text-xs text-gray-500">
            {formatearTamanoArchivo(evidencia.tamanoBytes)}
          </p>
        </div>
        {!soloLectura && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            isDisabled={eliminando}
            aria-label={`Eliminar ${evidencia.nombreOriginal}`}
            onClick={() => onEliminar(evidencia.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

/** Sección reutilizable para capturar/seleccionar fotos, previsualizar y subir con progreso. */
export function PanelEvidenciasActividad({
  actividadId,
  actividadNombre,
  evidenciasIniciales,
  soloLectura = false,
}: {
  actividadId: number;
  actividadNombre?: string;
  evidenciasIniciales?: EvidenciaActividadDiaria[];
  soloLectura?: boolean;
}) {
  const queryClient = useQueryClient();
  const galeriaInputRef = useRef<HTMLInputElement | null>(null);
  const camaraFallbackInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const pendientesRef = useRef<ImagenPendiente[]>([]);

  const [pendientes, setPendientes] = useState<ImagenPendiente[]>([]);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  pendientesRef.current = pendientes;

  const evidenciasQuery = useQuery({
    queryKey: ["actividades-diarias", "evidencias", actividadId],
    queryFn: () => listEvidenciasActividad(actividadId),
    initialData: evidenciasIniciales,
  });

  const cerrarStreamCamara = useCallback(() => {
    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }
    setCamaraAbierta(false);
  }, []);

  useEffect(() => {
    if (!camaraAbierta || !videoRef.current || !mediaStreamRef.current) return;
    videoRef.current.srcObject = mediaStreamRef.current;
  }, [camaraAbierta]);

  useEffect(() => {
    return () => {
      cerrarStreamCamara();
      for (const item of pendientesRef.current) {
        URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, [cerrarStreamCamara]);

  function agregarArchivos(fileList: FileList | File[] | null) {
    if (!fileList || fileList.length === 0) return;
    setMensajeExito(null);
    setMensajeError(null);

    const entrantes = Array.from(fileList);
    const nuevos: ImagenPendiente[] = [];
    const errores: string[] = [];
    const cupoRestante = MAX_ARCHIVOS_EVIDENCIA - pendientes.length;

    if (cupoRestante <= 0) {
      setMensajeError(
        `Puedes preparar hasta ${MAX_ARCHIVOS_EVIDENCIA} imágenes por subida.`,
      );
      return;
    }

    for (const archivo of entrantes.slice(0, cupoRestante)) {
      if (!esImagenValida(archivo)) {
        errores.push(
          `"${archivo.name}": formato no compatible. Usa JPG, PNG o WEBP.`,
        );
        continue;
      }
      if (archivo.size === 0) {
        errores.push(`"${archivo.name}": el archivo está vacío.`);
        continue;
      }
      if (archivo.size > MAX_TAMANO_IMAGEN_BYTES) {
        errores.push(`"${archivo.name}": supera el máximo permitido de 10 MB.`);
        continue;
      }
      nuevos.push({
        idLocal:
          typeof crypto !== "undefined" &&
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        file: archivo,
        previewUrl: URL.createObjectURL(archivo),
      });
    }

    if (entrantes.length > cupoRestante) {
      errores.push(
        `Solo se agregaron ${cupoRestante} imágenes para no exceder el límite de ${MAX_ARCHIVOS_EVIDENCIA} por subida.`,
      );
    }

    if (errores.length > 0) {
      setMensajeError(errores.join(" "));
    }
    if (nuevos.length > 0) {
      setPendientes((prev) => [...prev, ...nuevos]);
    }
  }

  function quitarPendiente(idLocal: string) {
    setPendientes((prev) => {
      const encontrado = prev.find((item) => item.idLocal === idLocal);
      if (encontrado) URL.revokeObjectURL(encontrado.previewUrl);
      return prev.filter((item) => item.idLocal !== idLocal);
    });
  }

  function limpiarPendientes() {
    setPendientes((prev) => {
      for (const item of prev) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return [];
    });
  }

  async function handleTomarFoto() {
    if (soloLectura || subiendo) return;
    setMensajeError(null);
    setMensajeExito(null);

    const soportaCamara =
      typeof navigator !== "undefined" &&
      Boolean(navigator.mediaDevices?.getUserMedia);

    if (!soportaCamara) {
      camaraFallbackInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      setCamaraAbierta(true);
    } catch {
      camaraFallbackInputRef.current?.click();
    }
  }

  function handleCapturarDeCamara() {
    const video = videoRef.current;
    if (!video) return;

    const ancho = video.videoWidth || 1280;
    const alto = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setMensajeError("No se pudo capturar la imagen desde la cámara.");
      cerrarStreamCamara();
      return;
    }
    ctx.drawImage(video, 0, 0, ancho, alto);
    canvas.toBlob(
      (blob) => {
        cerrarStreamCamara();
        if (!blob) {
          setMensajeError("No se pudo generar el archivo de la fotografía.");
          return;
        }
        const archivo = new File([blob], `camara-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        agregarArchivos([archivo]);
      },
      "image/jpeg",
      0.9,
    );
  }

  async function handleConfirmarSubida() {
    if (pendientes.length === 0 || subiendo || soloLectura) return;
    setMensajeError(null);
    setMensajeExito(null);
    setSubiendo(true);
    setProgreso(0);

    try {
      const subidas = await subirEvidenciasActividad(
        actividadId,
        pendientes.map((item) => item.file),
        (porcentaje) => setProgreso(porcentaje),
      );
      limpiarPendientes();
      setMensajeExito(
        subidas.length === 1
          ? "Se subió 1 imagen con éxito."
          : `Se subieron ${subidas.length} imágenes con éxito.`,
      );
      await queryClient.invalidateQueries({
        queryKey: ["actividades-diarias"],
      });
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 413) {
        setMensajeError(
          "Las imágenes superan el tamaño máximo permitido (10 MB por imagen).",
        );
      } else {
        const detalle = errorActividadDiaria(error);
        const esFallbackGenerico =
          isAxiosError(error) && !error.response?.data?.message;
        setMensajeError(
          esFallbackGenerico
            ? "No se pudieron subir las imágenes. Inténtalo de nuevo."
            : detalle.general ||
                "No se pudieron subir las imágenes. Inténtalo de nuevo.",
        );
      }
    } finally {
      setSubiendo(false);
    }
  }

  async function handleEliminarGuardada(evidenciaId: number) {
    if (soloLectura || eliminandoId !== null) return;
    setMensajeError(null);
    setMensajeExito(null);
    setEliminandoId(evidenciaId);
    try {
      await eliminarEvidenciaActividad(actividadId, evidenciaId);
      setMensajeExito("Evidencia eliminada correctamente.");
      await queryClient.invalidateQueries({
        queryKey: ["actividades-diarias"],
      });
    } catch (error) {
      setMensajeError(
        errorActividadDiaria(error).general ||
          "No se pudo eliminar la evidencia.",
      );
    } finally {
      setEliminandoId(null);
    }
  }

  const evidencias = evidenciasQuery.data ?? [];

  return (
    <section
      aria-label="Evidencia fotográfica"
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Evidencia fotográfica
          </h2>
          <p className="text-sm text-gray-500">
            {actividadNombre
              ? `Respalda visualmente "${actividadNombre}" con una o varias fotos (JPG, PNG o WEBP, máx. 10 MB).`
              : "Adjunta una o varias fotografías de respaldo (JPG, PNG o WEBP, máx. 10 MB)."}
          </p>
        </div>

        {!soloLectura && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              isDisabled={subiendo}
              onClick={() => void handleTomarFoto()}
            >
              <Camera className="mr-1.5 size-4" />
              Tomar foto
            </Button>
            <Button
              type="button"
              variant="outline"
              isDisabled={subiendo}
              onClick={() => galeriaInputRef.current?.click()}
            >
              <ImagePlus className="mr-1.5 size-4" />
              Elegir de la galería
            </Button>
          </div>
        )}
      </div>

      <input
        ref={camaraFallbackInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        capture="environment"
        aria-label="Tomar foto con cámara"
        className="hidden"
        onChange={(event) => {
          agregarArchivos(event.target.files);
          event.target.value = "";
        }}
      />
      <input
        ref={galeriaInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        multiple
        aria-label="Elegir imágenes de la galería"
        className="hidden"
        onChange={(event) => {
          agregarArchivos(event.target.files);
          event.target.value = "";
        }}
      />

      {camaraAbierta && (
        <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="max-h-64 w-full rounded-lg bg-black object-contain"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={handleCapturarDeCamara}>
              Capturar foto
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                cerrarStreamCamara();
                camaraFallbackInputRef.current?.click();
              }}
            >
              Elegir archivo del dispositivo
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={cerrarStreamCamara}
            >
              Cancelar cámara
            </Button>
          </div>
        </div>
      )}

      {pendientes.length > 0 && (
        <div className="space-y-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-800">
              Vista previa antes de subir ({pendientes.length})
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                isDisabled={subiendo}
                onClick={limpiarPendientes}
              >
                Cancelar selección
              </Button>
              <Button
                type="button"
                size="sm"
                isPending={subiendo}
                isDisabled={subiendo}
                onClick={() => void handleConfirmarSubida()}
              >
                <Upload className="mr-1.5 size-4" />
                {subiendo
                  ? "Subiendo…"
                  : `Confirmar subida (${pendientes.length})`}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {pendientes.map((item) => (
              <div
                key={item.idLocal}
                className="relative flex flex-col rounded-lg border border-gray-200 bg-white p-2"
              >
                <div className="mb-2 h-28 overflow-hidden rounded-md bg-gray-100">
                  <img
                    src={item.previewUrl}
                    alt={`Vista previa de ${item.file.name}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <p
                  className="truncate text-xs font-medium text-gray-800"
                  title={item.file.name}
                >
                  {item.file.name}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500">
                    {formatearTamanoArchivo(item.file.size)}
                  </span>
                  <button
                    type="button"
                    disabled={subiendo}
                    aria-label={`Quitar ${item.file.name}`}
                    onClick={() => quitarPendiente(item.idLocal)}
                    className="inline-flex items-center gap-0.5 text-xs font-medium text-red-700 hover:underline disabled:opacity-50"
                  >
                    <X className="size-3.5" />
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subiendo && (
        <div className="space-y-1.5 rounded-lg bg-gray-50 p-3">
          <div className="flex items-center justify-between text-xs font-medium text-gray-700">
            <span>Subiendo evidencias…</span>
            <span>{progreso}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Progreso de subida de evidencias"
            aria-valuenow={progreso}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200"
          >
            <div
              className="h-full rounded-full bg-gray-900 transition-all duration-150"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      )}

      {mensajeExito && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800"
        >
          {mensajeExito}
        </p>
      )}

      {mensajeError && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          {mensajeError}
        </p>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">
          Imágenes adjuntas ({evidencias.length})
        </h3>
        {evidenciasQuery.isPending && !evidenciasIniciales ? (
          <p role="status" className="text-sm text-gray-500">
            Cargando evidencias…
          </p>
        ) : evidencias.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
            Todavía no hay evidencias fotográficas adjuntas en esta actividad.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {evidencias.map((evidencia) => (
              <MiniaturaEvidenciaGuardada
                key={evidencia.id}
                actividadId={actividadId}
                evidencia={evidencia}
                soloLectura={soloLectura}
                eliminando={eliminandoId === evidencia.id}
                onEliminar={(id) => void handleEliminarGuardada(id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** Modal rápido para gestionar las evidencias desde el listado de actividades diarias. */
export function ModalEvidenciasActividad({
  actividad,
  soloLectura = false,
  onClose,
}: {
  actividad: ActividadDiaria | null;
  soloLectura?: boolean;
  onClose: () => void;
}) {
  if (!actividad) return null;

  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Backdrop isDismissable isKeyboardDismissDisabled={false}>
        <Modal.Container>
          <Modal.Dialog className="max-h-[90vh] w-full overflow-y-auto sm:max-w-3xl">
            <Modal.Header>
              <Modal.Heading>Evidencias de actividad</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <PanelEvidenciasActividad
                actividadId={actividad.id}
                actividadNombre={actividad.nombre}
                evidenciasIniciales={actividad.evidencias}
                soloLectura={
                  soloLectura || actividad.proyecto?.estado !== "ACTIVO"
                }
              />
            </Modal.Body>
            <Modal.Footer>
              <Button type="button" variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
