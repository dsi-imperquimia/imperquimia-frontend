import { Button } from "@heroui/react/button";
import { Modal } from "@heroui/react/modal";
import { CheckCircle2, WifiOff } from "lucide-react";
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
              <div className="flex items-center gap-3">
                {esExito ? (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <WifiOff className="h-5 w-5" />
                  </span>
                )}
                <Modal.Heading>
                  {esExito ? "Enviado con éxito" : "Sin conexión"}
                </Modal.Heading>
              </div>
            </Modal.Header>
            <Modal.Body>
              {esExito ? (
                <p
                  role="status"
                  aria-live="polite"
                  className="text-base font-medium text-gray-800"
                >
                  {MENSAJES_ACTIVIDAD.exito}
                </p>
              ) : (
                <p
                  role="alert"
                  className="text-base font-medium text-amber-900"
                >
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
