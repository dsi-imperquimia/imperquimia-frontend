import { AlertDialog } from "@heroui/react/alert-dialog";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { deleteUser } from "../api/delete-user";
import type { User } from "../types/user";

interface Props {
  user: User;
  onDeleteSuccess?: () => void;
}

export default function DialogDeleteUser({ user, onDeleteSuccess }: Props) {
  const handleDelete = async () => {
    const deletedUser = await deleteUser(user.id).catch(() => {
      toast.danger(
        "Error al eliminar el usuario. Por favor, inténtalo de nuevo.",
      );
    });

    if (!deletedUser) {
      toast.danger(
        "Error al eliminar el usuario. Por favor, inténtalo de nuevo.",
      );
      return;
    }

    toast.success("Usuario eliminado correctamente");
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
                Esto eliminará permanentemente al usuario{" "}
                <strong>
                  {user.name} {user.lastName}
                </strong>{" "}
                y todos sus datos. Esta acción no se puede deshacer.
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary">
                Cancelar
              </Button>
              <Button slot="close" variant="danger" onClick={handleDelete}>
                Eliminar Usuario
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
