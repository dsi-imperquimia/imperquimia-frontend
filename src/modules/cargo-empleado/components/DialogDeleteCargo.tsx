import { AlertDialog } from "@heroui/react/alert-dialog";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { deleteCargo } from "../api/delete-cargo";
import type { Cargo } from "../types/cargo";

interface Props {
  cargo: Cargo;
  onDeleteSuccess?: () => void;
}

export default function DialogDeleteCargo({
  cargo,
  onDeleteSuccess,
}: Props) {
  const handleDelete = async () => {
    const deletedCargo = await deleteCargo(cargo.id).catch(() => {
      toast.danger("Error al eliminar el cargo. Por favor, inténtalo de nuevo.");
    });

    if (!deletedCargo) {
      toast.danger("Error al eliminar el cargo. Por favor, inténtalo de nuevo.");
      return;
    }

    toast.success("Cargo eliminado correctamente");
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
                Eliminar cargo permanentemente?
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>
                Esto eliminará permanentemente el cargo <strong>
                  {cargo.nombre}
                </strong> y todos sus datos relacionados. Esta acción no se
                puede deshacer.
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary">
                Cancelar
              </Button>
              <Button slot="close" variant="danger" onClick={handleDelete}>
                Eliminar cargo
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
