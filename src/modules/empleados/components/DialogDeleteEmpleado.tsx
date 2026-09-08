import { AlertDialog } from "@heroui/react/alert-dialog";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { deleteEmpleado } from "../api/delete-empleado";
import type { Empleado } from "../types/empleado";

interface Props {
  empleado: Empleado;
  onDeleteSuccess?: () => void;
}

export default function DialogDeleteEmpleado({
  empleado,
  onDeleteSuccess,
}: Props) {
  const handleDelete = async () => {
    const deletedEmpleado = await deleteEmpleado(empleado.id).catch(() => {
      toast.danger(
        "Error al eliminar el empleado. Por favor, inténtalo de nuevo.",
      );
    });

    if (!deletedEmpleado) {
      toast.danger(
        "Error al eliminar el empleado. Por favor, inténtalo de nuevo.",
      );
      return;
    }

    toast.success("Empleado eliminado correctamente");
    onDeleteSuccess?.();
  };

  return (
    <AlertDialog>
      <Button variant="danger" size="sm">
        Eliminar
      </Button>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-100">
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>
                Eliminar empleado permanentemente?
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>
                Esto eliminará permanentemente al empleado <strong>
                  {empleado.nombreCompleto}
                </strong> y todos sus datos. Esta acción no se puede deshacer.
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary">
                Cancelar
              </Button>
              <Button slot="close" variant="danger" onClick={handleDelete}>
                Eliminar Empleado
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
