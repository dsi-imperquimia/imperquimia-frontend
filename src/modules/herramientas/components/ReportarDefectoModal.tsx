import { TextAreaField } from "@components/fields/TextAreaField";
import { Button } from "@heroui/react/button";
import { Modal } from "@heroui/react/modal";
import { toast } from "@heroui/react/toast";
import { AlertTriangle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { crearReporteDefecto } from "../api/reportesDefecto";
import type { Herramienta } from "../types/herramientas";

export function ReportarDefectoModal({
  herramienta,
  onSuccess,
}: {
  herramienta: Herramienta;
  onSuccess: () => Promise<unknown> | void;
}) {
  const [open, setOpen] = useState(false);
  const [observacion, setObservacion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (observacion.trim().length < 3) {
      setError("Describe el defecto con al menos 3 caracteres.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await crearReporteDefecto(herramienta.id, observacion.trim());
      await onSuccess();
      toast.success("Defecto reportado. La herramienta requiere revisión.");
      setOpen(false);
      setObservacion("");
    } catch {
      setError(
        "No se pudo registrar el defecto. Revisa tus permisos o si ya existe un reporte pendiente.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal isOpen={open} onOpenChange={(value) => !pending && setOpen(value)}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <AlertTriangle className="mr-1 size-4" />
        Reportar defecto
      </Button>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="w-full sm:max-w-xl">
            <Modal.CloseTrigger />
            <Modal.Header>
              <div>
                <Modal.Heading>Reportar herramienta defectuosa</Modal.Heading>
                <p className="text-sm font-normal text-gray-500">
                  {herramienta.nombre} · {herramienta.codigoUnico}
                </p>
              </div>
            </Modal.Header>
            <form onSubmit={submit}>
              <Modal.Body className="space-y-4">
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  La ubicación no cambiará. El estado pasará a “Requiere
                  revisión”.
                </p>
                <TextAreaField
                  label="Observaciones de estado"
                  placeholder="Describe el daño, falla o comportamiento observado"
                  value={observacion}
                  onChange={(event) => setObservacion(event.target.value)}
                  maxLength={1000}
                  isRequired
                />
                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  type="button"
                  variant="tertiary"
                  onClick={() => setOpen(false)}
                  isDisabled={pending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isPending={pending}
                  isDisabled={pending || observacion.trim().length < 3}
                >
                  Registrar reporte
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
