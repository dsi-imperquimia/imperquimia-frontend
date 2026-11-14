import { Button } from "@heroui/react/button";
import { Modal } from "@heroui/react/modal";
import { useEffect, useState } from "react";
import {
  DURACION_MINIMA_MODAL_MS,
  MENSAJES_ACTIVIDAD,
} from "../types/actividad-diaria";

export type EstadoModalResultadoActividad = "exito" | "error_conexion" | null;

export function ModalResultadoActividad({
  estado,
  onClose,
}: {
  estado: EstadoModalResultadoActividad;
  onClose: () => void;
}) {
  const [puedeCerrarExito, setPuedeCerrarExito] = useState(false);
  const esExito = estado === "exito";
  const isOpen = estado !== null;

  useEffect(() => {
    if (estado !== "exito") {
      setPuedeCerrarExito(false);
      return;
    }
    setPuedeCerrarExito(false);
    const timer = globalThis.setTimeout(() => {
      setPuedeCerrarExito(true);
      onClose();
    }, DURACION_MINIMA_MODAL_MS);
    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [estado, onClose]);

  function handleOpenChange(open: boolean) {
    if (open) return;
    if (esExito && !puedeCerrarExito) return;
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      isDismissable={!esExito || puedeCerrarExito}
      isKeyboardDismissDisabled={esExito && !puedeCerrarExito}
    >
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="w-full sm:max-w-md">
            <Modal.Header>
              <Modal.Heading>
                {esExito ? "Enviado con éxito" : "Sin conexión"}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              {esExito ? (
                <p role="status" aria-live="polite">
                  {MENSAJES_ACTIVIDAD.exito}
                </p>
              ) : (
                <p role="alert" className="text-red-700">
                  {MENSAJES_ACTIVIDAD.errorConexion}
                </p>
              )}
            </Modal.Body>
            <Modal.Footer>
              {esExito ? (
                <Button
                  type="button"
                  onClick={() => {
                    if (puedeCerrarExito) onClose();
                  }}
                  isDisabled={!puedeCerrarExito}
                >
                  Aceptar
                </Button>
              ) : (
                <Button type="button" onClick={onClose}>
                  Entendido
                </Button>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
