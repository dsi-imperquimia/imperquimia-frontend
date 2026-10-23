import { AlertDialog } from "@heroui/react/alert-dialog";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { cancelarProyecto, errorCancelarProyecto } from "../api/guardarProyecto";
import type { Proyecto } from "../types/proyectos";

export function DialogCancelarProyecto({ proyecto }: { proyecto: Proyecto }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const client = useQueryClient();
  return (
    <AlertDialog>
      <Button variant="danger">Cancelar proyecto</Button>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>Cancelar proyecto</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>
                ¿Cancelar «{proyecto.nombre}»? Permanecerá en el listado para
                consulta. Antes debes retirar sus herramientas y empleados
                asignados.
              </p>
              {error && (
                <p role="alert" className="mt-3 text-red-700">
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
                    await cancelarProyecto(proyecto.id);
                    await client.invalidateQueries({ queryKey: ["proyectos"] });
                    await client.invalidateQueries({
                      queryKey: ["proyectos-filter"],
                    });
                    toast.success("Proyecto cancelado");
                    await navigate({ to: "/proyectos" });
                  } catch (e) {
                    setError(errorCancelarProyecto(e));
                  } finally {
                    setPending(false);
                  }
                }}
              >
                Confirmar cancelación
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
