import { AlertDialog } from "@heroui/react/alert-dialog";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { eliminarProyecto, errorProyecto } from "../api/guardarProyecto";
import type { Proyecto } from "../types/proyectos";
export function DialogDeleteProyecto({ proyecto }: { proyecto: Proyecto }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const client = useQueryClient();
  return (
    <AlertDialog>
      <Button variant="danger">Eliminar</Button>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>Eliminar proyecto</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>
                ¿Eliminar «{proyecto.nombre}» del listado? No se permite
                eliminarlo si tiene herramientas o empleados asignados.
              </p>
              {error && (
                <p role="alert" className="mt-3 text-red-700">
                  {error}
                </p>
              )}
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary" isDisabled={pending}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                isPending={pending}
                isDisabled={pending}
                onClick={async () => {
                  setPending(true);
                  setError("");
                  try {
                    await eliminarProyecto(proyecto.id);
                    await client.invalidateQueries({ queryKey: ["proyectos"] });
                    await client.invalidateQueries({
                      queryKey: ["proyectos-filter"],
                    });
                    toast.success("Proyecto eliminado");
                    await navigate({ to: "/proyectos" });
                  } catch (e) {
                    setError(errorProyecto(e));
                  } finally {
                    setPending(false);
                  }
                }}
              >
                Eliminar proyecto
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
