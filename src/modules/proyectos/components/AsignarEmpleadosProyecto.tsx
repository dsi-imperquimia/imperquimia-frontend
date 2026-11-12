import { InputField } from "@components/fields/InputField";
import { SelectedField } from "@components/fields/SelectedField";
import { Button } from "@heroui/react/button";
import { Chip } from "@heroui/react/chip";
import { ListBox } from "@heroui/react/list-box";
import { Modal } from "@heroui/react/modal";
import { Table } from "@heroui/react/table";
import { toast } from "@heroui/react/toast";
import { userActions } from "@modules/auth/store/authStore";
import { listEmpleados } from "@modules/empleados/api/list-empleados";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  UserMinus,
  UserPlus,
  Users,
  UserX,
  Wrench,
} from "lucide-react";
import { useState } from "react";
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
  const [busqueda, setBusqueda] = useState("");
  const [cargoFiltro, setCargoFiltro] = useState("");
  const [habilidadFiltro, setHabilidadFiltro] = useState("");

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
      empleado.activo && !asignados.some((a) => a.empleadoId === empleado.id),
  );
  const cargosDisponibles = [
    ...new Set(
      empleadosDisponibles
        .map((empleado) => empleado.cargo?.nombre)
        .filter((nombre): nombre is string => Boolean(nombre)),
    ),
  ].sort();
  const habilidadesDisponibles = [
    ...new Map(
      empleadosDisponibles
        .flatMap((empleado) => empleado.habilidades)
        .map((h) => [h.habilidad.id, h.habilidad.nombre] as const),
    ),
  ]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([id, nombre]) => ({ id, nombre }));
  const texto = busqueda.trim().toLowerCase();
  const empleadosFiltrados = empleadosDisponibles.filter(
    (empleado) =>
      (!cargoFiltro || empleado.cargo?.nombre === cargoFiltro) &&
      (!habilidadFiltro ||
        empleado.habilidades.some(
          (h) => String(h.habilidadId) === habilidadFiltro,
        )) &&
      (!texto ||
        empleado.nombreCompleto.toLowerCase().includes(texto) ||
        empleado.dui.toLowerCase().includes(texto) ||
        (empleado.cargo?.nombre ?? "").toLowerCase().includes(texto)),
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
                <Modal.Dialog className="max-w-6xl w-full">
                  <Modal.CloseTrigger />
                  <Modal.Header className="flex flex-row items-center gap-3">
                    <Modal.Icon className="bg-gray-100 text-gray-500">
                      <Wrench className="size-5" />
                    </Modal.Icon>
                    <Modal.Heading>Asignar técnico</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body className="max-h-[34rem] overflow-y-auto p-0">
                    <div className="flex flex-wrap gap-3  px-0 py-4">
                      <InputField
                        label="Buscar"
                        placeholder="Nombre, DUI o cargo"
                        className="min-w-48 flex-1"
                        startContent={<Search className="size-4" />}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                      />
                      <SelectedField
                        label="Cargo"
                        placeholder="Todos los cargos"
                        className="min-w-48"
                        value={cargoFiltro}
                        onChange={(value) => setCargoFiltro(String(value))}
                      >
                        <ListBox.Item id="" textValue="Todos los cargos">
                          Todos los cargos
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        {cargosDisponibles.map((cargo) => (
                          <ListBox.Item
                            key={cargo}
                            id={cargo}
                            textValue={cargo}
                          >
                            {cargo}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </SelectedField>
                      <SelectedField
                        label="Habilidad"
                        placeholder="Todas las habilidades"
                        className="min-w-48"
                        value={habilidadFiltro}
                        onChange={(value) =>
                          setHabilidadFiltro(String(value))
                        }
                      >
                        <ListBox.Item id="" textValue="Todas las habilidades">
                          Todas las habilidades
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        {habilidadesDisponibles.map((habilidad) => (
                          <ListBox.Item
                            key={habilidad.id}
                            id={String(habilidad.id)}
                            textValue={habilidad.nombre}
                          >
                            {habilidad.nombre}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </SelectedField>
                    </div>
                    {empleadosFiltrados.length ? (
                      <Table>
                        <Table.ScrollContainer>
                          <Table.Content
                            aria-label="Empleados disponibles"
                            className="min-w-full"
                          >
                            <Table.Header>
                              <Table.Column isRowHeader>Empleado</Table.Column>
                              <Table.Column>DUI</Table.Column>
                              <Table.Column>Cargo</Table.Column>
                              <Table.Column>Habilidades</Table.Column>
                              <Table.Column>Registro</Table.Column>
                              <Table.Column>Acciones</Table.Column>
                            </Table.Header>
                            <Table.Body>
                              <Table.Collection items={empleadosFiltrados}>
                                {(empleado) => (
                                  <Table.Row key={empleado.id}>
                                    <Table.Cell>
                                      {empleado.nombreCompleto}
                                    </Table.Cell>
                                    <Table.Cell>{empleado.dui}</Table.Cell>
                                    <Table.Cell>
                                      {empleado.cargo?.nombre ?? "Sin cargo"}
                                    </Table.Cell>
                                    <Table.Cell>
                                      {empleado.habilidades.length ? (
                                        <div className="flex flex-wrap gap-1">
                                          {empleado.habilidades.map((h) => (
                                            <Chip key={h.habilidadId} size="sm">
                                              {h.habilidad.nombre}
                                            </Chip>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400">
                                          Sin habilidades
                                        </span>
                                      )}
                                    </Table.Cell>
                                    <Table.Cell>
                                      {new Date(
                                        empleado.fechaRegistro,
                                      ).toLocaleDateString("es-ES")}
                                    </Table.Cell>
                                    <Table.Cell>
                                      <Button
                                        type="button"
                                        size="sm"
                                        isDisabled={pendiente !== null}
                                        isPending={pendiente === empleado.id}
                                        onClick={() =>
                                          handleAsignar(empleado.id)
                                        }
                                      >
                                        <UserPlus className="size-4" />
                                        Asignar
                                      </Button>
                                    </Table.Cell>
                                  </Table.Row>
                                )}
                              </Table.Collection>
                            </Table.Body>
                          </Table.Content>
                        </Table.ScrollContainer>
                      </Table>
                    ) : (
                      <p className="flex items-center gap-2 px-6 py-4 text-gray-500">
                        <UserX className="size-5 text-gray-400" />
                        {empleadosDisponibles.length
                          ? "Ningún empleado coincide con el filtro."
                          : "No hay empleados disponibles para asignar."}
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
                  {a.empleado.habilidades.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {a.empleado.habilidades.map((h) => (
                        <Chip key={h.habilidadId} size="sm">
                          {h.habilidad.nombre}
                        </Chip>
                      ))}
                    </div>
                  )}
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
