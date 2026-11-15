import { Button } from "@heroui/react/button";
import { Modal } from "@heroui/react/modal";
import { useEffect, useState } from "react";
import {
  DURACION_MINIMA_MODAL_MS,
  MENSAJES_ACTIVIDAD,
} from "../types/actividad-diaria";

export type EstadoModalResultadoActividad =
  "exito" | "editado" | "error_conexion" | null;

const CONTENIDO: Record<
  Exclude<EstadoModalResultadoActividad, null>,
  { titulo: string; mensaje: string; boton: string }
> = {
  // GPRCIMPER-50 CA1
  exito: {
    titulo: "Enviado con éxito",
    mensaje: MENSAJES_ACTIVIDAD.exito,
    boton: "Aceptar",
  },
  // GPRCIMPER-34 CA3
  editado: {
    titulo: "Edición completada",
    mensaje: MENSAJES_ACTIVIDAD.editadoExito,
    boton: "Aceptar",
  },
  // GPRCIMPER-50 CA3
  error_conexion: {
    titulo: "Sin conexión",
    mensaje: MENSAJES_ACTIVIDAD.errorConexion,
    boton: "Entendido",
  },
};

export function ModalResultadoActividad({
  estado,
  onClose,
}: {
  estado: EstadoModalResultadoActividad;
  onClose: () => void;
}) {
  // GPRCIMPER-50 CA2: el indicador de "guardado" se mantiene al menos 3 s.
  const [exitoDesbloqueado, setExitoDesbloqueado] = useState(false);
  const puedeCerrar = estado !== "exito" || exitoDesbloqueado;

  useEffect(() => {
    if (estado !== "exito") {
      setExitoDesbloqueado(false);
      return;
    }
    setExitoDesbloqueado(false);
    const timer = globalThis.setTimeout(() => {
      setExitoDesbloqueado(true);
      onClose();
    }, DURACION_MINIMA_MODAL_MS);
    return () => globalThis.clearTimeout(timer);
  }, [estado, onClose]);

  if (estado === null) return null;
  const contenido = CONTENIDO[estado];
  const esError = estado === "error_conexion";

  function cerrar() {
    if (puedeCerrar) onClose();
  }

  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open) cerrar();
      }}
    >
      <Modal.Backdrop
        isDismissable={puedeCerrar}
        isKeyboardDismissDisabled={!puedeCerrar}
      >
        <Modal.Container>
          <Modal.Dialog className="w-full sm:max-w-md">
            <Modal.Header>
              <Modal.Heading>{contenido.titulo}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p
                role={esError ? "alert" : "status"}
                aria-live={esError ? undefined : "polite"}
                className={esError ? "text-red-700" : undefined}
              >
                {contenido.mensaje}
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button type="button" onClick={cerrar} isDisabled={!puedeCerrar}>
                {contenido.boton}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
