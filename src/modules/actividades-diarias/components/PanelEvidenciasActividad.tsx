import { Button } from "@heroui/react/button";
import { Modal } from "@heroui/react/modal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Camera, ImagePlus, RefreshCw, Trash2, Upload, X } from "lucide-react";
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

type ModoCamara = "environment" | "user";

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
    <div className="group flex flex-col justify-between rounded-lg border border-gray-200 bg-gray-50 p-1.5">
      <div className="relative mb-1.5 flex h-24 items-center justify-center overflow-hidden rounded-md bg-gray-100">
        {urlImagen ? (
          <img
            src={urlImagen}
            alt={evidencia.nombreOriginal}
            className="h-full w-full object-cover"
          />
        ) : errorCarga ? (
          <span className="px-2 text-center text-[11px] text-red-600">
            Sin vista previa
          </span>
        ) : (
          <span className="text-[11px] text-gray-500">Cargando…</span>
        )}

        {!soloLectura && (
          <button
            type="button"
            disabled={eliminando}
            aria-label={`Eliminar ${evidencia.nombreOriginal}`}
            onClick={() => onEliminar(evidencia.id)}
            className="absolute top-1 right-1 inline-flex size-6 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-xs transition hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
      <div className="min-w-0 px-0.5">
        <p
          className="truncate text-[11px] font-medium text-gray-800"
          title={evidencia.nombreOriginal}
        >
          {evidencia.nombreOriginal}
        </p>
        <p className="text-[11px] text-gray-500">
          {formatearTamanoArchivo(evidencia.tamanoBytes)}
        </p>
      </div>
    </div>
  );
}

function VisorCamara({
  attachVideoRef,
  cargandoCamara,
  camaraLista,
  errorCamara,
  onCapturar,
  onCambiarCamara,
  onUsarArchivo,
  onCancelar,
}: {
  attachVideoRef: (node: HTMLVideoElement | null) => void;
  cargandoCamara: boolean;
  camaraLista: boolean;
  errorCamara: string | null;
  onCapturar: () => void;
  onCambiarCamara: () => void;
  onUsarArchivo: () => void;
  onCancelar: () => void;
}) {
  return (
    <div className="space-y-3">
      {errorCamara ? (
        <div
          role="alert"
          className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center"
        >
          <p className="text-sm text-amber-900">{errorCamara}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" size="sm" onClick={onUsarArchivo}>
              Elegir foto del dispositivo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancelar}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative flex aspect-4/3 max-h-64 w-full items-center justify-center overflow-hidden rounded-xl bg-gray-950">
            <video
              ref={attachVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            {cargandoCamara && !camaraLista && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-medium text-white">
                Iniciando cámara…
              </div>
            )}
            <button
              type="button"
              aria-label="Cambiar cámara"
              disabled={cargandoCamara}
              onClick={onCambiarCamara}
              className="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-xs transition hover:bg-black/80 disabled:opacity-50"
            >
              <RefreshCw className="size-3.5" />
              Voltear
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancelar}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onUsarArchivo}
              >
                Usar archivo
              </Button>
            </div>
            <Button
              type="button"
              size="sm"
              isDisabled={!camaraLista || cargandoCamara}
              onClick={onCapturar}
            >
              <Camera className="mr-1.5 size-4" />
              Capturar foto
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/** Sección compacta para capturar/seleccionar fotos, previsualizar y subir con progreso. */
export function PanelEvidenciasActividad({
  actividadId,
  actividadNombre,
  evidenciasIniciales,
  soloLectura = false,
  dentroDeModal = false,
  onCamaraActivaChange,
}: {
  actividadId: number;
  actividadNombre?: string;
  evidenciasIniciales?: EvidenciaActividadDiaria[];
  soloLectura?: boolean;
  dentroDeModal?: boolean;
  onCamaraActivaChange?: (activa: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const galeriaInputRef = useRef<HTMLInputElement | null>(null);
  const camaraFallbackInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const pendientesRef = useRef<ImagenPendiente[]>([]);

  const [pendientes, setPendientes] = useState<ImagenPendiente[]>([]);
  const [modalCamaraAbierto, setModalCamaraAbierto] = useState(false);
  const [cargandoCamara, setCargandoCamara] = useState(false);
  const [camaraLista, setCamaraLista] = useState(false);
  const [errorCamara, setErrorCamara] = useState<string | null>(null);
  const [modoCamara, setModoCamara] = useState<ModoCamara>("environment");
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

  const detenerStreamCamara = useCallback(() => {
    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const cerrarCamara = useCallback(() => {
    detenerStreamCamara();
    setModalCamaraAbierto(false);
    setCargandoCamara(false);
    setCamaraLista(false);
    setErrorCamara(null);
    onCamaraActivaChange?.(false);
  }, [detenerStreamCamara, onCamaraActivaChange]);

  const attachVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (
      node &&
      mediaStreamRef.current &&
      node.srcObject !== mediaStreamRef.current
    ) {
      node.srcObject = mediaStreamRef.current;
      void node.play?.().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!camaraLista || !videoRef.current || !mediaStreamRef.current) return;
    if (videoRef.current.srcObject !== mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
      void videoRef.current.play?.().catch(() => undefined);
    }
  }, [camaraLista]);

  useEffect(() => {
    return () => {
      detenerStreamCamara();
      onCamaraActivaChange?.(false);
      for (const item of pendientesRef.current) {
        URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, [detenerStreamCamara, onCamaraActivaChange]);

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

  async function iniciarStreamCamara(facingMode: ModoCamara) {
    detenerStreamCamara();
    setCargandoCamara(true);
    setCamaraLista(false);
    setErrorCamara(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play?.().catch(() => undefined);
      }
      setCamaraLista(true);
    } catch {
      setErrorCamara(
        "No se pudo acceder a la cámara en vivo. Puedes elegir una foto o usar la cámara del dispositivo.",
      );
    } finally {
      setCargandoCamara(false);
    }
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

    setModalCamaraAbierto(true);
    onCamaraActivaChange?.(true);
    await iniciarStreamCamara(modoCamara);
  }

  async function handleCambiarCamara() {
    const siguiente: ModoCamara =
      modoCamara === "environment" ? "user" : "environment";
    setModoCamara(siguiente);
    await iniciarStreamCamara(siguiente);
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
      cerrarCamara();
      return;
    }
    ctx.drawImage(video, 0, 0, ancho, alto);
    canvas.toBlob(
      (blob) => {
        cerrarCamara();
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

  const inputsOcultos = (
    <>
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
    </>
  );

  const visorCamara = (
    <VisorCamara
      attachVideoRef={attachVideoRef}
      cargandoCamara={cargandoCamara}
      camaraLista={camaraLista}
      errorCamara={errorCamara}
      onCapturar={handleCapturarDeCamara}
      onCambiarCamara={() => void handleCambiarCamara()}
      onUsarArchivo={() => {
        cerrarCamara();
        camaraFallbackInputRef.current?.click();
      }}
      onCancelar={cerrarCamara}
    />
  );

  if (dentroDeModal && modalCamaraAbierto) {
    return (
      <div className="space-y-2">
        {inputsOcultos}
        {visorCamara}
      </div>
    );
  }

  return (
    <section
      aria-label="Evidencia fotográfica"
      className={
        dentroDeModal
          ? "space-y-3"
          : "space-y-3 rounded-xl border border-gray-200 bg-white p-4"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Evidencia fotográfica
          </h2>
          <p className="text-xs text-gray-500">
            {actividadNombre
              ? `${actividadNombre} · JPG, PNG o WEBP (máx. 10 MB).`
              : "JPG, PNG o WEBP (máx. 10 MB por imagen)."}
          </p>
        </div>

        {!soloLectura && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              isDisabled={subiendo}
              onClick={() => void handleTomarFoto()}
            >
              <Camera className="mr-1.5 size-4" />
              Tomar foto
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              isDisabled={subiendo}
              onClick={() => galeriaInputRef.current?.click()}
            >
              <ImagePlus className="mr-1.5 size-4" />
              Elegir de la galería
            </Button>
          </div>
        )}
      </div>

      {inputsOcultos}

      {!dentroDeModal && modalCamaraAbierto && (
        <Modal
          isOpen
          onOpenChange={(open) => {
            if (!open) cerrarCamara();
          }}
        >
          <Modal.Backdrop isDismissable isKeyboardDismissDisabled={false}>
            <Modal.Container>
              <Modal.Dialog className="w-full sm:max-w-md">
                <Modal.Header>
                  <Modal.Heading>Tomar fotografía</Modal.Heading>
                </Modal.Header>
                <Modal.Body>{visorCamara}</Modal.Body>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      )}

      {pendientes.length > 0 && (
        <div className="space-y-2.5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-gray-800">
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
                <Upload className="mr-1.5 size-3.5" />
                {subiendo
                  ? "Subiendo…"
                  : `Confirmar subida (${pendientes.length})`}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {pendientes.map((item) => (
              <div
                key={item.idLocal}
                className="flex flex-col rounded-lg border border-gray-200 bg-white p-1.5"
              >
                <div className="relative mb-1.5 h-20 overflow-hidden rounded-md bg-gray-100">
                  <img
                    src={item.previewUrl}
                    alt={`Vista previa de ${item.file.name}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    disabled={subiendo}
                    aria-label={`Quitar ${item.file.name}`}
                    onClick={() => quitarPendiente(item.idLocal)}
                    className="absolute top-1 right-1 inline-flex size-5 items-center justify-center rounded-full bg-white/90 text-red-700 shadow-xs hover:bg-red-50 disabled:opacity-50"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                <p
                  className="truncate text-[11px] font-medium text-gray-800"
                  title={item.file.name}
                >
                  {item.file.name}
                </p>
                <span className="text-[11px] text-gray-500">
                  {formatearTamanoArchivo(item.file.size)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {subiendo && (
        <div className="space-y-1 rounded-lg bg-gray-50 p-2.5">
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
            className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
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
          className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800"
        >
          {mensajeExito}
        </p>
      )}

      {mensajeError && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
        >
          {mensajeError}
        </p>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-medium text-gray-700">
          Imágenes adjuntas ({evidencias.length})
        </h3>
        {evidenciasQuery.isPending && !evidenciasIniciales ? (
          <p role="status" className="text-xs text-gray-500">
            Cargando evidencias…
          </p>
        ) : evidencias.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-center text-xs text-gray-500">
            Todavía no hay evidencias fotográficas adjuntas en esta actividad.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
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

/** Modal rápido y compacto para gestionar las evidencias o tomar foto desde el listado. */
export function ModalEvidenciasActividad({
  actividad,
  soloLectura = false,
  onClose,
}: {
  actividad: ActividadDiaria | null;
  soloLectura?: boolean;
  onClose: () => void;
}) {
  const [camaraActiva, setCamaraActiva] = useState(false);

  useEffect(() => {
    setCamaraActiva(false);
  }, [actividad?.id]);

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
          <Modal.Dialog
            className={
              camaraActiva
                ? "max-h-[90vh] w-full overflow-y-auto sm:max-w-md"
                : "max-h-[90vh] w-full overflow-y-auto sm:max-w-2xl"
            }
          >
            <Modal.Header>
              <Modal.Heading>
                {camaraActiva ? "Tomar fotografía" : "Evidencias de actividad"}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <PanelEvidenciasActividad
                actividadId={actividad.id}
                actividadNombre={actividad.nombre}
                evidenciasIniciales={actividad.evidencias}
                soloLectura={
                  soloLectura || actividad.proyecto?.estado !== "ACTIVO"
                }
                dentroDeModal
                onCamaraActivaChange={setCamaraActiva}
              />
            </Modal.Body>
            {!camaraActiva && (
              <Modal.Footer>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                >
                  Cerrar
                </Button>
              </Modal.Footer>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
