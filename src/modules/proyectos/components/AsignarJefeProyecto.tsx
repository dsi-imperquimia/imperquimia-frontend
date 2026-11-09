import { SelectedField } from "@components/fields/SelectedField";
import { Button } from "@heroui/react/button";
import { ListBox } from "@heroui/react/list-box";
import { toast } from "@heroui/react/toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HardHat, UserMinus, UserPlus, UserX } from "lucide-react";
import { useState } from "react";
import { listEmpleados } from "@modules/empleados/api/list-empleados";
import { userActions } from "@modules/auth/store/authStore";
import { listProyectos } from "../api/listProyectos";
import {
  asignarJefeProyecto,
  errorJefeProyecto,
  retirarJefeProyecto,
} from "../api/guardarProyecto";
import type { ProyectoDetalle } from "../types/proyectos";

export function AsignarJefeProyecto({
  proyecto,
  editable = true,
  className = "rounded-xl border border-gray-200 bg-white p-6",
}: {
  proyecto: ProyectoDetalle;
  /** En la vista de solo lectura (detalle del proyecto) no se permite editar. */
  editable?: boolean;
  /** Permite fundir el bloque dentro de otro contenedor (p. ej. el formulario de edición). */
  className?: string;
}) {
  const client = useQueryClient();
  const puedeEditar = editable && userActions.hasPermission("PROYECTO_UPDATE");
  const [empleadoId, setEmpleadoId] = useState<number | "">("");
  const [pending, setPending] = useState(false);

  const { data: empleados = [] } = useQuery({
    queryKey: ["empleados"],
    queryFn: listEmpleados,
    enabled: puedeEditar,
  });

  // Empleados que ya son jefe de OTRO proyecto activo: no deben aparecer
  // como candidatos, para no asignar a alguien que ya está al frente de otra obra.
  const { data: proyectos = [] } = useQuery({
    queryKey: ["proyectos"],
    queryFn: listProyectos,
    enabled: puedeEditar,
  });
  const ocupadosEnOtroProyecto = new Set(
    proyectos
      .filter(
        (otro) =>
          otro.id !== proyecto.id &&
          otro.estado === "ACTIVO" &&
          otro.jefeProyectoId,
      )
      .map((otro) => otro.jefeProyectoId),
  );

  async function refrescar() {
    await client.invalidateQueries({ queryKey: ["proyectos", proyecto.id] });
  }

  async function handleAsignar() {
    if (empleadoId === "") return;
    setPending(true);
    try {
      await asignarJefeProyecto(proyecto.id, empleadoId);
      await refrescar();
      setEmpleadoId("");
      toast.success("Jefe de proyecto asignado");
    } catch (error) {
      toast.danger(errorJefeProyecto(error));
    } finally {
      setPending(false);
    }
  }

  async function handleRetirar() {
    setPending(true);
    try {
      await retirarJefeProyecto(proyecto.id);
      await refrescar();
      toast.success("Jefe de proyecto retirado");
    } catch (error) {
      toast.danger(errorJefeProyecto(error));
    } finally {
      setPending(false);
    }
  }

  const empleadosDisponibles = empleados.filter(
    (empleado) =>
      empleado.activo &&
      empleado.id !== proyecto.jefeProyectoId &&
      !ocupadosEnOtroProyecto.has(empleado.id),
  );

  return (
    <section className={className}>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <HardHat className="size-5 text-gray-400" />
        Jefe de proyecto
      </h2>
      {proyecto.jefeProyecto ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <HardHat className="size-5" />
            </span>
            <div>
              <p className="font-medium">
                {proyecto.jefeProyecto.nombreCompleto}
              </p>
              <p className="text-sm text-gray-500">
                {proyecto.jefeProyecto.cargo?.nombre ?? "Sin cargo"}
              </p>
            </div>
          </div>
          {puedeEditar && proyecto.estado !== "CANCELADO" && (
            <Button
              type="button"
              variant="outline"
              isDisabled={pending}
              isPending={pending}
              onClick={handleRetirar}
            >
              <UserMinus className="size-4" />
              Quitar jefe
            </Button>
          )}
        </div>
      ) : (
        <p className="mb-4 flex items-center gap-2 text-gray-500">
          <UserX className="size-5 text-gray-400" />
          Este proyecto todavía no tiene un jefe de proyecto asignado.
        </p>
      )}
      {puedeEditar && proyecto.estado !== "CANCELADO" && (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <SelectedField
            label="Asignar empleado como jefe"
            placeholder="Selecciona un empleado"
            className="min-w-60"
            value={empleadoId}
            onChange={(value) =>
              setEmpleadoId(value === "" ? "" : Number(value))
            }
          >
            {empleadosDisponibles.map((empleado) => (
              <ListBox.Item
                key={empleado.id}
                id={empleado.id}
                textValue={empleado.nombreCompleto}
              >
                {empleado.nombreCompleto}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </SelectedField>
          <Button
            type="button"
            isDisabled={empleadoId === "" || pending}
            isPending={pending}
            onClick={handleAsignar}
          >
            <UserPlus className="size-4" />
            Asignar
          </Button>
        </div>
      )}
    </section>
  );
}
