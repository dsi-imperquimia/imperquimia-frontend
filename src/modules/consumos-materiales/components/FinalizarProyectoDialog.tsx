import { AlertDialog } from "@heroui/react/alert-dialog";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import type { ProyectoDetalle } from "@modules/proyectos/types/proyectos";
import { useState } from "react";
import { CircleCheckBig } from "lucide-react";
import {
  errorConsumoMaterial,
  finalizarProyectoConSaldos,
} from "../api/consumos-materiales";

export function FinalizarProyectoDialog({
  proyecto,
  onSuccess,
}: {
  proyecto: ProyectoDetalle;
  onSuccess: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  return (
    <AlertDialog isOpen={open} onOpenChange={setOpen}>
      <Button variant="outline">
        <CircleCheckBig className="mr-1 size-4" />
        Finalizar proyecto
      </Button>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>Finalizar proyecto</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>
                El material que todavía quede en el proyecto se registrará como
                consumo de cierre y su existencia quedará en cero. No volverá a
                bodega. Antes deben retirarse las herramientas. Los técnicos
                permanecerán asociados al historial del proyecto y podrán
                retirarse posteriormente.
              </p>
              {error && (
                <p className="mt-3 text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary" isDisabled={pending}>
                Volver
              </Button>
              <Button
                variant="danger"
                isPending={pending}
                isDisabled={pending}
                onClick={async () => {
                  setPending(true);
                  setError("");
                  try {
                    await finalizarProyectoConSaldos(proyecto.id);
                    await onSuccess();
                    toast.success("Proyecto finalizado");
                    setOpen(false);
                  } catch (requestError) {
                    setError(errorConsumoMaterial(requestError));
                  } finally {
                    setPending(false);
                  }
                }}
              >
                Confirmar cierre
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
