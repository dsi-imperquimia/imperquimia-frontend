import { DatePickerField } from "@components/fields/DatePickerField";
import { Button } from "@heroui/react/button";
import { Modal } from "@heroui/react/modal";
import { toast } from "@heroui/react/toast";
import { Download } from "lucide-react";
import { useState, type FormEvent } from "react";
import { descargarReporteConsumos } from "../api/consumos-materiales";

export function DescargarReporteConsumosModal({
  proyectoId,
}: {
  proyectoId: number;
}) {
  const [open, setOpen] = useState(false);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (desde && hasta && desde > hasta) {
      setError("La fecha inicial no puede ser posterior a la fecha final.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = await descargarReporteConsumos(proyectoId, {
        desde: desde || undefined,
        hasta: hasta || undefined,
      });
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Reporte PDF generado.");
      setOpen(false);
    } catch {
      setError("No se pudo generar el PDF. Inténtalo nuevamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal isOpen={open} onOpenChange={(value) => !pending && setOpen(value)}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Download className="mr-1 size-4" />
        Descargar PDF
      </Button>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="w-full sm:max-w-lg">
            <Modal.CloseTrigger />
            <Modal.Header>
              <div>
                <Modal.Heading>Reporte de materiales</Modal.Heading>
                <p className="text-sm font-normal text-gray-500">
                  Deja las fechas vacías para incluir todo el proyecto.
                </p>
              </div>
            </Modal.Header>
            <form onSubmit={submit}>
              <Modal.Body className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <DatePickerField
                    label="Desde"
                    value={desde}
                    onChange={setDesde}
                  />
                  <DatePickerField
                    label="Hasta"
                    value={hasta}
                    onChange={setHasta}
                  />
                </div>
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
                <Button type="submit" isPending={pending}>
                  Generar PDF
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
