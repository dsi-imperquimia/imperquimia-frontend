import { InputField } from "@components/fields/InputField";
import { SelectedField } from "@components/fields/SelectedField";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { ListBox } from "@heroui/react/list-box";
import { Modal } from "@heroui/react/modal";
import { Table } from "@heroui/react/table";
import { toast } from "@heroui/react/toast";
import { userActions } from "@modules/auth/store/authStore";
import { listEmpleados } from "@modules/empleados/api/list-empleados";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HardHat, Search, UserMinus, UserPlus, UserX } from "lucide-react";
import { useState } from "react";
import {
  asignarJefeProyecto,
  errorJefeProyecto,
  retirarJefeProyecto,
} from "../api/guardarProyecto";
import { listProyectos } from "../api/listProyectos";
import type { ProyectoDetalle } from "../types/proyectos";

export function AsignarJefeProyecto({
  proyecto,
  editable = true,
  variant = "card",
}: {
  proyecto: ProyectoDetalle;
  /** En la vista de solo lectura (detalle del proyecto) no se permite editar. */
  editable?: boolean;
  /** "card" lo envuelve en una Card independiente (detalle del proyecto);
   * "embedded" lo funde como sección dentro de otro contenedor (formulario de edición). */
  variant?: "card" | "embedded";
}) {
  const client = useQueryClient();
  const puedeEditar = editable && userActions.hasPermission("PROYECTO_UPDATE");
  const puedeAsignar = puedeEditar && proyecto.estado === "ACTIVO";
  const [pendiente, setPendiente] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [cargoFiltro, setCargoFiltro] = useState("");

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

  async function handleAsignar(empleadoId: number) {
    setPendiente(true);
    try {
      await asignarJefeProyecto(proyecto.id, empleadoId);
      await refrescar();
      toast.success("Jefe de proyecto asignado");
    } catch (error) {
      toast.danger(errorJefeProyecto(error));
    } finally {
      setPendiente(false);
    }
  }

  async function handleRetirar() {
    setPendiente(true);
    try {
      await retirarJefeProyecto(proyecto.id);
      await refrescar();
      toast.success("Jefe de proyecto retirado");
    } catch (error) {
      toast.danger(errorJefeProyecto(error));
    } finally {
      setPendiente(false);
    }
  }

  const empleadosDisponibles = empleados.filter(
    (empleado) =>
      empleado.activo &&
      empleado.id !== proyecto.jefeProyectoId &&
      !ocupadosEnOtroProyecto.has(empleado.id),
  );
  const cargosDisponibles = [
    ...new Set(
      empleadosDisponibles
        .map((empleado) => empleado.cargo?.nombre)
        .filter((nombre): nombre is string => Boolean(nombre)),
    ),
  ].sort();
  const texto = busqueda.trim().toLowerCase();
  const empleadosFiltrados = empleadosDisponibles.filter(
    (empleado) =>
      (!cargoFiltro || empleado.cargo?.nombre === cargoFiltro) &&
      (!texto ||
        empleado.nombreCompleto.toLowerCase().includes(texto) ||
        empleado.dui.toLowerCase().includes(texto) ||
        (empleado.cargo?.nombre ?? "").toLowerCase().includes(texto)),
  );

  const botonAsignar = puedeAsignar && (
    <Modal>
      <Button type="button" variant="outline" size="sm">
        <UserPlus className="size-4" />
        Asignar jefe
      </Button>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-4xl w-full">
            <Modal.CloseTrigger />
            <Modal.Header className="flex flex-row items-center gap-3">
              <Modal.Icon className="bg-gray-100 text-gray-500">
                <HardHat className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Asignar jefe de proyecto</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="max-h-[34rem] overflow-y-auto p-0">
              <div className="flex flex-wrap gap-3 px-0 py-4">
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
                    <ListBox.Item key={cargo} id={cargo} textValue={cargo}>
                      {cargo}
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
                        <Table.Column>Cargo</Table.Column>
                        <Table.Column>Acción</Table.Column>
                      </Table.Header>
                      <Table.Body>
                        <Table.Collection items={empleadosFiltrados}>
                          {(empleado) => (
                            <Table.Row key={empleado.id}>
                              <Table.Cell>{empleado.nombreCompleto}</Table.Cell>
                              <Table.Cell>
                                {empleado.cargo?.nombre ?? "Sin cargo"}
                              </Table.Cell>
                              <Table.Cell>
                                <Button
                                  type="button"
                                  size="sm"
                                  isDisabled={pendiente}
                                  isPending={pendiente}
                                  onClick={() => handleAsignar(empleado.id)}
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
  );

  const contenido = (
    <>
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
          {puedeEditar && (
            <Button
              type="button"
              variant="outline"
              isDisabled={pendiente}
              isPending={pendiente}
              onClick={handleRetirar}
            >
              <UserMinus className="size-4" />
              Quitar jefe
            </Button>
          )}
        </div>
      ) : (
        <p className="flex items-center gap-2 text-gray-500">
          <UserX className="size-5 text-gray-400" />
          Este proyecto todavía no tiene un jefe de proyecto asignado.
        </p>
      )}
    </>
  );

  if (variant === "embedded") {
    return (
      <section className="space-y-4 border-t border-gray-200 pt-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <HardHat className="size-5 text-gray-400" />
            Jefe de proyecto
          </h2>
          {botonAsignar}
        </div>
        {contenido}
      </section>
    );
  }

  return (
    <Card className="w-full">
      <Card.Header className="flex flex-row items-center justify-between gap-2 text-lg font-medium">
        <span className="flex items-center gap-2">
          <HardHat className="text-muted inline size-5" />
          Jefe de proyecto
        </span>
        {botonAsignar}
      </Card.Header>
      <Card.Content>{contenido}</Card.Content>
    </Card>
  );
}
