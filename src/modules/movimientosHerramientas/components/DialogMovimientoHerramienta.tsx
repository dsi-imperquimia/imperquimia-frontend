import { Button } from "@heroui/react/button";
import { ArrowRightLeft } from "lucide-react";
import { AlertDialog as Dialog } from "@heroui/react/alert-dialog";

import { FormMovimiento } from "@/modules/movimientosHerramientas/components/FormMovimiento";
import type { Herramienta } from "@/modules/herramientas/types/herramientas";

interface Props {
  herramienta: Herramienta;
  onMovementSuccess?: () => void;
}

export default function DialogMovimientoHerramienta({
  herramienta,
  onMovementSuccess,
}: Props) {
  return (
    <Dialog>
      <Dialog.Trigger>
        <Button
          size="sm"
          variant="secondary"
          className="border border-gray-200 shadow-sm hover:bg-gray-100 flex items-center gap-1.5"
        >
          <ArrowRightLeft className="size-3.5" />
          <span>Trasladar</span>
        </Button>
      </Dialog.Trigger>

      <Dialog.Backdrop isDismissable>
        <Dialog.Container>
          <Dialog.Dialog className="sm:max-w-xl">
            {({ close }) => (
              <>
                <Dialog.CloseTrigger />

                <Dialog.Header>
                  <Dialog.Icon status="warning" />
                  <Dialog.Heading>Registrar Traslado de Activo</Dialog.Heading>
                </Dialog.Header>

                <Dialog.Body>
                  <p className="text-sm text-gray-500 mb-4">
                    Asigna un nuevo destino o cambia el estado operativo del equipo.
                    Toda transferencia generará una bitácora de auditoría histórica inmediata.
                  </p>

                  <FormMovimiento
                    herramienta={herramienta}
                    onSuccess={() => {
                      onMovementSuccess?.();
                      close();
                    }}
                  />
                </Dialog.Body>

                <Dialog.Footer>
                  <Button
                    onPress={close}
                    variant="tertiary"
                    className="w-full sm:w-auto"
                  >
                    Cerrar Ventana
                  </Button>
                </Dialog.Footer>
              </>
            )}
          </Dialog.Dialog>
        </Dialog.Container>
      </Dialog.Backdrop>
    </Dialog>
  );
}