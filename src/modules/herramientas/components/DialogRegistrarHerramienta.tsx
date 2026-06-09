import React from "react";
import { Button } from "@heroui/react/button";
import { Plus } from "lucide-react";
import { AlertDialog as Dialog } from "@heroui/react/alert-dialog";

// CORREGIDO: Importación relativa directa desde la misma carpeta components
import { FormHerramienta } from "./FormHerramienta";

interface Props {
  onSuccess?: () => void;
}

export function DialogCreateHerramienta({ onSuccess }: Props) {
  return (
    <Dialog>
      <Dialog.Trigger>
        <Button
          className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm flex items-center gap-1.5"
        >
          <Plus className="size-4" />
          <span>Registrar Herramienta</span>
        </Button>
      </Dialog.Trigger>

      <Dialog.Backdrop isDismissable>
        <Dialog.Container>
          <Dialog.Dialog className="sm:max-w-xl">
            {({ close }) => (
              <>
                <Dialog.CloseTrigger />

                <Dialog.Header>
                  <Dialog.Icon status="success" />
                  <Dialog.Heading>Dar de alta Nueva Herramienta</Dialog.Heading>
                </Dialog.Header>

                <Dialog.Body>
                  <p className="text-sm text-gray-500 mb-4">
                    Ingresa los datos del nuevo activo custodio. El sistema procesará el correlativo interno y asignará un código único inmutable de forma automática.
                  </p>

                  <FormHerramienta
                    onSuccess={() => {
                      onSuccess?.();
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
                    Cancelar
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