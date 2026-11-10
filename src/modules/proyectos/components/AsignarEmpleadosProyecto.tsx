import { SelectedField } from "@components/fields/SelectedField";
import { Button } from "@heroui/react/button";
import { ListBox } from "@heroui/react/list-box";
import { toast } from "@heroui/react/toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, UserMinus, UserPlus, UserX, Wrench } from "lucide-react";
import { useState } from "react";
import { listEmpleados } from "@modules/empleados/api/list-empleados";
import { userActions } from "@modules/auth/store/authStore";
import {
  asignarEmpleadoProyecto,
  errorEmpleadoProyecto,
  retirarEmpleadoProyecto,
} from "../api/guardarProyecto";
import type { ProyectoDetalle } from "../types/proyectos";

export function AsignarEmpleadosProyecto({
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
  const [pendiente, setPendiente] = useState<number | "nuevo" | null>(null);

  const { data: empleados = [] } = useQuery({
    queryKey: ["empleados"],
    queryFn: listEmpleados,
    enabled: puedeEditar,
  });

  const asignados = proyecto.empleados.filter((a) => !a.fechaRetiro);

  async function refrescar() {
    await client.invalidateQueries({ queryKey: ["proyectos", proyecto.id] });
  }

  async function handleAsignar() {
    if (empleadoId === "") return;
    setPendiente("nuevo");
    try {
      await asignarEmpleadoProyecto(proyecto.id, empleadoId);
      await refrescar();
      setEmpleadoId("");
      toast.success("Técnico asignado al proyecto");
    } catch (error) {
      toast.danger(errorEmpleadoProyecto(error));
    } finally {
      setPendiente(null);
    }
  }

  async function handleRetirar(id: number) {
    setPendiente(id);
    try {
      await retirarEmpleadoProyecto(proyecto.id, id);
      await refrescar();
      toast.success("Técnico retirado del proyecto");
    } catch (error) {
      toast.danger(errorEmpleadoProyecto(error));
    } finally {
      setPendiente(null);
    }
  }

  // Empleados activos que todavía no están asignados a este proyecto.
  // El backend valida si ya tienen otra asignación activa en cualquier otro proyecto.
  const empleadosDisponibles = empleados.filter(
    (empleado) =>
      empleado.activo &&
      !asignados.some((a) => a.empleadoId === empleado.id),
  );

  return (
    <section className={className}>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Users className="size-5 text-gray-400" />
        Técnicos asignados
      </h2>
      {asignados.length ? (
        <ul className="divide-y divide-gray-200">
          {asignados.map((a) => (
            <li
              key={a.empleadoId}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <Wrench className="size-5" />
                </span>
                <div>
                  <p className="font-medium">{a.empleado.nombreCompleto}</p>
                  <p className="text-sm text-gray-500">
                    {a.empleado.cargo?.nombre ?? "Sin cargo"}
                  </p>
                </div>
              </div>
              {puedeEditar && proyecto.estado !== "CANCELADO" && (
                <Button
                  type="button"
                  variant="outline"
                  isDisabled={pendiente !== null}
                  isPending={pendiente === a.empleadoId}
                  onClick={() => handleRetirar(a.empleadoId)}
                >
                  <UserMinus className="size-4" />
                  Retirar
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 flex items-center gap-2 text-gray-500">
          <UserX className="size-5 text-gray-400" />
          Este proyecto todavía no tiene técnicos asignados.
        </p>
      )}
      {puedeEditar && proyecto.estado !== "CANCELADO" && (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <SelectedField
            label="Asignar técnico"
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
            isDisabled={empleadoId === "" || pendiente !== null}
            isPending={pendiente === "nuevo"}
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
