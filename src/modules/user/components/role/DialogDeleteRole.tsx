import { AlertDialog } from "@heroui/react/alert-dialog";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { deleteRole } from "@modules/user/api/roles/delete-role";
import type { Role } from "@modules/user/types/roles";

interface Props {
  role: Role;
  onDeleteSuccess?: () => void;
}

export default function DialogDeleteRole({ role, onDeleteSuccess }: Props) {
  const handleDelete = async () => {
    const deletedUser = await deleteRole(role.id).catch(() => {
      toast.danger("Error al eliminar el role. Por favor, inténtalo de nuevo.");
    });

    if (!deletedUser) {
      toast.danger("Error al eliminar el role. Por favor, inténtalo de nuevo.");
      return;
    }

    toast.success("role eliminado correctamente");
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
                Eliminar usuario permanentemente?
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>
                Esto eliminará permanentemente el rol:{" "}
                <strong>{role.name}</strong> y todos sus datos. Esta acción no
                se puede deshacer.
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary">
                Cancelar
              </Button>
              <Button slot="close" variant="danger" onClick={handleDelete}>
                Eliminar Role
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
