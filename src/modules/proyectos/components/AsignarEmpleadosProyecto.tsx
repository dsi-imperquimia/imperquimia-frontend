import { Button } from "@heroui/react/button";
import { Modal } from "@heroui/react/modal";
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
  const puedeAsignar = puedeEditar && proyecto.estado !== "CANCELADO";
  const [pendiente, setPendiente] = useState<number | null>(null);

  const { data: empleados = [] } = useQuery({
    queryKey: ["empleados"],
    queryFn: listEmpleados,
    enabled: puedeEditar,
  });

  const asignados = proyecto.empleados.filter((a) => !a.fechaRetiro);

  async function refrescar() {
    await client.invalidateQueries({ queryKey: ["proyectos", proyecto.id] });
  }

  async function handleAsignar(id: number) {
    setPendiente(id);
    try {
      await asignarEmpleadoProyecto(proyecto.id, id);
      await refrescar();
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
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Users className="size-5 text-gray-400" />
          Técnicos asignados
        </h2>
        {puedeAsignar && (
          <Modal>
            <Button type="button" variant="outline" size="sm">
              <UserPlus className="size-4" />
              Asignar técnico
            </Button>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog className="sm:max-w-md">
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Icon className="bg-gray-100 text-gray-500">
                      <Wrench className="size-5" />
                    </Modal.Icon>
                    <Modal.Heading>Asignar técnico</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body className="max-h-80 overflow-y-auto p-0">
                    {empleadosDisponibles.length ? (
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="text-gray-500">
                            <th className="px-6 py-2 font-normal">Empleado</th>
                            <th className="px-6 py-2 font-normal">Cargo</th>
                            <th className="px-6 py-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {empleadosDisponibles.map((empleado) => (
                            <tr
                              key={empleado.id}
                              className="border-t border-gray-200"
                            >
                              <td className="px-6 py-2">
                                {empleado.nombreCompleto}
                              </td>
                              <td className="px-6 py-2 text-gray-500">
                                {empleado.cargo?.nombre ?? "Sin cargo"}
                              </td>
                              <td className="px-6 py-2 text-right">
                                <Button
                                  type="button"
                                  size="sm"
                                  isDisabled={pendiente !== null}
                                  isPending={pendiente === empleado.id}
                                  onClick={() => handleAsignar(empleado.id)}
                                >
                                  <UserPlus className="size-4" />
                                  Asignar
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="flex items-center gap-2 px-6 py-4 text-gray-500">
                        <UserX className="size-5 text-gray-400" />
                        No hay empleados disponibles para asignar.
                      </p>
                    )}
                  </Modal.Body>
                  <Modal.Footer>
                    <Button slot="close" variant="secondary">
                      Cerrar
                    </Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        )}
      </div>
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
              {puedeAsignar && (
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
        <p className="flex items-center gap-2 text-gray-500">
          <UserX className="size-5 text-gray-400" />
          Este proyecto todavía no tiene técnicos asignados.
        </p>
      )}
    </section>
  );
}
