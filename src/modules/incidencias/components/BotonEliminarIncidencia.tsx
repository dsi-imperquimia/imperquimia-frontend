import { ConfirmActionDialog } from "@components/ConfirmActionDialog";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { eliminarIncidencia, errorIncidencia } from "../api/incidencias";
import type { Incidencia } from "../types/incidencia";

/** GPRCIMPER-141: elimina la incidencia previa confirmación y vuelve al listado. */
export function BotonEliminarIncidencia({
  incidencia,
  size = "md",
  volverAlListado = true,
}: {
  incidencia: Pick<Incidencia, "id" | "titulo" | "actividadDiaria">;
  size?: "sm" | "md";
  /** En el detalle vuelve al listado; en el listado solo se refresca. */
  volverAlListado?: boolean;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);

  async function confirmar(): Promise<boolean> {
    try {
      await eliminarIncidencia(incidencia.id);
    } catch (error) {
      toast.danger(
        errorIncidencia(error).general ?? "No se pudo eliminar la incidencia.",
      );
      return false;
    }
    toast.success("Incidencia eliminada correctamente");
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["incidencias"] }),
      // El conteo de incidencias de la jornada también cambia.
      queryClient.invalidateQueries({ queryKey: ["actividades-diarias"] }),
    ]);
    if (volverAlListado) await navigate({ to: "/incidencias" });
    return true;
  }

  return (
    <>
      <Button variant="danger" size={size} onClick={() => setAbierto(true)}>
        {size === "sm" ? "Eliminar" : "Eliminar incidencia"}
      </Button>
      <ConfirmActionDialog
        isOpen={abierto}
        onOpenChange={setAbierto}
        title="¿Eliminar incidencia?"
        confirmLabel="Eliminar"
        description={
          <p>
            Se eliminará la incidencia <strong>{incidencia.titulo}</strong>
            {incidencia.actividadDiaria && (
              <>
                {" "}
                y dejará de aparecer en la actividad{" "}
                <strong>{incidencia.actividadDiaria.nombre}</strong>
              </>
            )}
            . Esta acción no se puede deshacer desde la aplicación.
          </p>
        }
        onConfirm={confirmar}
      />
    </>
  );
}
