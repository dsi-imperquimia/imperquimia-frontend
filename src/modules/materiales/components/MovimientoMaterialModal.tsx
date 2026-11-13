import { InputField } from "@components/fields/InputField";
import { SelectedField } from "@components/fields/SelectedField";
import { TextAreaField } from "@components/fields/TextAreaField";
import { ComboBox } from "@heroui/react/combo-box";
import { Button } from "@heroui/react/button";
import { Label } from "@heroui/react/label";
import { ListBox } from "@heroui/react/list-box";
import { Modal } from "@heroui/react/modal";
import { toast } from "@heroui/react/toast";
import type { Material } from "@modules/materiales/types/material";
import type { Proyecto } from "@modules/proyectos/types/proyectos";
import { useEffect, useState, type FormEvent } from "react";
import {
  errorMovimientoMaterial,
  registrarMovimientoMaterial,
} from "../api/inventario-materiales";
import {
  MOTIVO_LABEL,
  type ExistenciaMaterial,
  type MotivoMovimientoMaterial,
} from "../types/inventario-material";

type TipoFormulario = "ENTRADA" | "SALIDA";

const MOTIVOS: Record<TipoFormulario, MotivoMovimientoMaterial[]> = {
  ENTRADA: ["COMPRA", "DEVOLUCION_PROYECTO"],
  SALIDA: ["USO_PROYECTO", "VENTA"],
};

const nuevaClave = () => globalThis.crypto.randomUUID();

function searchable(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

export function MovimientoMaterialModal({
  tipo,
  isOpen,
  onOpenChange,
  materiales,
  proyectos,
  existencias,
  initialMaterialId,
  onSuccess,
}: {
  tipo: TipoFormulario;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  materiales: Material[];
  proyectos: Proyecto[];
  existencias: ExistenciaMaterial[];
  initialMaterialId?: number;
  onSuccess: () => Promise<void>;
}) {
  const [materialId, setMaterialId] = useState(
    initialMaterialId ? String(initialMaterialId) : "",
  );
  const [materialSearch, setMaterialSearch] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState<MotivoMovimientoMaterial>(
    MOTIVOS[tipo][0],
  );
  const [proyectoId, setProyectoId] = useState("");
  const [observacion, setObservacion] = useState("");
  const [claveOperacion, setClaveOperacion] = useState(nuevaClave);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string>();

  const requiereProyecto =
    motivo === "DEVOLUCION_PROYECTO" || motivo === "USO_PROYECTO";
  const materialSeleccionado = materiales.find(
    (material) => material.id === Number(materialId),
  );
  const materialQuery = searchable(materialSearch.trim());
  const materialesVisibles = materiales.filter((material) => {
    if (material.id === materialSeleccionado?.id) return true;
    return searchable(
      [material.codigo, material.nombre, material.descripcion, material.unidad]
        .filter(Boolean)
        .join(" "),
    ).includes(materialQuery);
  });
  const proyectosConMaterial = new Set(
    existencias
      .filter(
        (existencia) =>
          existencia.material.id === Number(materialId) &&
          existencia.ubicacion.tipo === "PROYECTO" &&
          existencia.ubicacion.proyectoId !== null &&
          Number(existencia.cantidad) > 0,
      )
      .map((existencia) => existencia.ubicacion.proyectoId),
  );
  const proyectosElegibles = proyectos.filter((proyecto) =>
    tipo === "SALIDA"
      ? proyecto.estado === "ACTIVO"
      : proyecto.estado === "ACTIVO" && proyectosConMaterial.has(proyecto.id),
  );
  const existenciaBodega = existencias.find(
    (existencia) =>
      existencia.material.id === Number(materialId) &&
      existencia.ubicacion.tipo === "BODEGA",
  );
  const existenciaProyecto = existencias.find(
    (existencia) =>
      existencia.material.id === Number(materialId) &&
      existencia.ubicacion.proyectoId === Number(proyectoId),
  );
  const existenciaOrigen =
    tipo === "SALIDA"
      ? existenciaBodega
      : motivo === "DEVOLUCION_PROYECTO"
        ? existenciaProyecto
        : undefined;
  const saldoMostrado =
    motivo === "DEVOLUCION_PROYECTO"
      ? existenciaProyecto?.cantidad
      : existenciaBodega?.cantidad;

  useEffect(() => {
    setMotivo(MOTIVOS[tipo][0]);
    setMaterialId(initialMaterialId ? String(initialMaterialId) : "");
    setMaterialSearch(
      materiales.find((material) => material.id === initialMaterialId)
        ?.nombre ?? "",
    );
    setProyectoId("");
    setError(undefined);
  }, [tipo, isOpen, initialMaterialId, materiales]);

  function reset() {
    setMaterialId("");
    setMaterialSearch("");
    setCantidad("");
    setMotivo(MOTIVOS[tipo][0]);
    setProyectoId("");
    setObservacion("");
    setClaveOperacion(nuevaClave());
    setError(undefined);
  }

  function handleOpenChange(open: boolean) {
    if (isPending) return;
    onOpenChange(open);
    if (!open) reset();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const cantidadNumero = Number(cantidad);
    if (!materialId) return setError("Selecciona un material.");
    if (!Number.isFinite(cantidadNumero) || cantidadNumero <= 0) {
      return setError("Ingresa una cantidad mayor que cero.");
    }
    if (requiereProyecto && !proyectoId) {
      return setError("Selecciona el proyecto del movimiento.");
    }
    if (!Number.isInteger(cantidadNumero)) {
      return setError("La cantidad debe ser un número entero.");
    }
    if (
      existenciaOrigen &&
      cantidadNumero > Number(existenciaOrigen.cantidad)
    ) {
      return setError(
        `La cantidad supera el saldo disponible. Actualmente hay ${Number(existenciaOrigen.cantidad).toLocaleString("es-SV", { maximumFractionDigits: 2 })} ${materialSeleccionado?.unidad ?? "unidades"}.`,
      );
    }

    setIsPending(true);
    setError(undefined);
    try {
      const result = await registrarMovimientoMaterial(tipo, {
        claveOperacion,
        materialId: Number(materialId),
        cantidad: cantidadNumero,
        motivo,
        proyectoId: requiereProyecto ? Number(proyectoId) : undefined,
        observacion: observacion.trim() || undefined,
      });
      await onSuccess();
      toast.success(
        result.repetido
          ? "El movimiento ya había sido registrado."
          : `${tipo === "ENTRADA" ? "Entrada" : "Salida"} registrada con éxito.`,
      );
      onOpenChange(false);
      reset();
    } catch (requestError) {
      setError(errorMovimientoMaterial(requestError));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-h-[calc(100vh-2rem)] w-full overflow-hidden sm:max-w-2xl">
            <Modal.CloseTrigger />
            <Modal.Header>
              <div>
                <Modal.Heading>
                  Registrar {tipo === "ENTRADA" ? "entrada" : "salida"}
                </Modal.Heading>
                <p className="text-sm font-normal text-gray-500">
                  El saldo y el historial se actualizarán en una sola operación.
                </p>
              </div>
            </Modal.Header>
            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <Modal.Body className="min-h-0 space-y-4 overflow-y-auto">
                <ComboBox
                  items={materialesVisibles}
                  inputValue={materialSearch}
                  selectedKey={materialId || null}
                  onInputChange={(value) => {
                    setMaterialSearch(value);
                    if (
                      materialSeleccionado &&
                      value !== materialSeleccionado.nombre
                    ) {
                      setMaterialId("");
                    }
                  }}
                  onSelectionChange={(key) => {
                    const id = String(key ?? "");
                    setMaterialId(id);
                    setMaterialSearch(
                      materiales.find((material) => material.id === Number(id))
                        ?.nombre ?? "",
                    );
                    setProyectoId("");
                  }}
                  allowsCustomValue={false}
                  menuTrigger="focus"
                  variant="secondary"
                  fullWidth
                  isRequired
                >
                  <Label>Material</Label>
                  <ComboBox.InputGroup>
                    <ComboBox.Value placeholder="Busca por nombre, código, descripción o unidad" />
                    <ComboBox.Trigger />
                  </ComboBox.InputGroup>
                  <ComboBox.Popover>
                    <ListBox items={materialesVisibles}>
                      {(material) => (
                        <ListBox.Item
                          id={String(material.id)}
                          textValue={material.nombre}
                        >
                          <div className="flex w-full justify-between gap-4">
                            <span>{material.nombre}</span>
                            <span className="text-xs text-gray-500">
                              {material.codigo || `#${material.id}`} ·{" "}
                              {material.unidad}
                            </span>
                          </div>
                        </ListBox.Item>
                      )}
                    </ListBox>
                  </ComboBox.Popover>
                </ComboBox>

                {materialId && saldoMostrado !== undefined && (
                  <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800">
                    {motivo === "DEVOLUCION_PROYECTO"
                      ? "Disponible en el proyecto seleccionado"
                      : "Disponible actualmente en bodega"}
                    :{" "}
                    <strong>
                      {Number(saldoMostrado).toLocaleString("es-SV", {
                        maximumFractionDigits: 2,
                      })}{" "}
                      {materialSeleccionado?.unidad}
                    </strong>
                  </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="Cantidad"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={cantidad}
                    onChange={(event) => setCantidad(event.target.value)}
                    isRequired
                  />
                  <SelectedField
                    label="Motivo"
                    placeholder="Selecciona el motivo"
                    selectedKey={motivo}
                    onSelectionChange={(key) => {
                      setMotivo(key as MotivoMovimientoMaterial);
                      setProyectoId("");
                    }}
                    isRequired
                  >
                    {MOTIVOS[tipo].map((item) => (
                      <ListBox.Item
                        key={item}
                        id={item}
                        textValue={MOTIVO_LABEL[item]}
                      >
                        {MOTIVO_LABEL[item]}
                      </ListBox.Item>
                    ))}
                  </SelectedField>
                </div>

                {requiereProyecto && (
                  <SelectedField
                    label={
                      tipo === "ENTRADA"
                        ? "Proyecto de origen"
                        : "Proyecto destino"
                    }
                    placeholder="Selecciona un proyecto"
                    selectedKey={proyectoId || null}
                    onSelectionChange={(key) =>
                      setProyectoId(String(key ?? ""))
                    }
                    isRequired
                  >
                    {proyectosElegibles.map((proyecto) => (
                      <ListBox.Item
                        key={proyecto.id}
                        id={String(proyecto.id)}
                        textValue={proyecto.nombre}
                      >
                        {proyecto.nombre}
                      </ListBox.Item>
                    ))}
                  </SelectedField>
                )}

                {requiereProyecto && proyectosElegibles.length === 0 && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {tipo === "ENTRADA"
                      ? materialId
                        ? "Este material no tiene existencias pendientes de devolución en ningún proyecto."
                        : "Selecciona un material para ver los proyectos con existencias."
                      : "No hay proyectos activos disponibles para recibir materiales."}
                  </p>
                )}

                <TextAreaField
                  label="Observación"
                  placeholder="Detalle opcional para la auditoría"
                  value={observacion}
                  onChange={(event) => setObservacion(event.target.value)}
                />

                {error && (
                  <p
                    className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                    role="alert"
                  >
                    {error}
                  </p>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  type="button"
                  variant="tertiary"
                  onClick={() => handleOpenChange(false)}
                  isDisabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isPending={isPending}
                  isDisabled={isPending}
                >
                  Registrar {tipo === "ENTRADA" ? "entrada" : "salida"}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
