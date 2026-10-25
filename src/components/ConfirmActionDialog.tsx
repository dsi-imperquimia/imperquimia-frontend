import { AlertDialog } from "@heroui/react/alert-dialog";
import { Button } from "@heroui/react/button";
import { useRef, useState, type ReactNode } from "react";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  status?: "warning" | "danger";
  onConfirm: () => Promise<boolean>;
}

export function ConfirmActionDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel,
  status = "danger",
  onConfirm,
}: Props) {
  const inFlight = useRef(false);
  const [isPending, setIsPending] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (inFlight.current && !open) return;
    onOpenChange(open);
  };

  const handleConfirm = async () => {
    if (inFlight.current) return;

    inFlight.current = true;
    setIsPending(true);

    try {
      if (await onConfirm()) onOpenChange(false);
    } finally {
      inFlight.current = false;
      setIsPending(false);
    }
  };

  return (
    <AlertDialog isOpen={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-100">
            <AlertDialog.Header>
              <AlertDialog.Icon status={status} />
              <AlertDialog.Heading>{title}</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>{description}</AlertDialog.Body>
            <AlertDialog.Footer>
              <Button
                variant="tertiary"
                onClick={() => handleOpenChange(false)}
                isDisabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                variant={status === "danger" ? "danger" : undefined}
                onClick={handleConfirm}
                isPending={isPending}
                isDisabled={isPending}
              >
                {confirmLabel}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
