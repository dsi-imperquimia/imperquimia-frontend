import { InputField } from "@components/fields/InputField";
import { TextAreaField } from "@components/fields/TextAreaField";
import { Button } from "@heroui/react/button";
import { ComboBox } from "@heroui/react/combo-box";
import { Label } from "@heroui/react/label";
import { ListBox } from "@heroui/react/list-box";
import { Modal } from "@heroui/react/modal";
import { Table } from "@heroui/react/table";
import { toast } from "@heroui/react/toast";
import type { ProyectoDetalle } from "@modules/proyectos/types/proyectos";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  errorMovimientoMaterial,
  listExistenciasMateriales,
  registrarSalidaMaterialesProyecto,
} from "../api/inventario-materiales";
import { listMateriales } from "../api/list-materiales";
import type { Material } from "../types/material";
import { MaterialComboBoxControl } from "./MaterialComboBoxControl";

type FilaEnvio = {
  materialId: number;
  cantidad: string;
  claveOperacion: string;
  origen: "PRESUPUESTO" | "MANUAL";
};

const nuevaClave = () => globalThis.crypto.randomUUID();
const searchable = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();

export function EnviarMaterialesProyectoModal({
  proyecto,
  isOpen,
  onOpenChange,
  onSuccess,
}: {
  proyecto: Pick<ProyectoDetalle, "id" | "nombre" | "detalles">;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
}) {
  const [filas, setFilas] = useState<FilaEnvio[]>([]);
  const [materialId, setMaterialId] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [observacion, setObservacion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const materialesQuery = useQuery({
    queryKey: ["materiales"],
    queryFn: listMateriales,
    enabled: isOpen,
  });
  const existenciasQuery = useQuery({
    queryKey: ["inventario-materiales", "existencias"],
    queryFn: listExistenciasMateriales,
    enabled: isOpen,
  });

  const stockBodega = useMemo(
    () =>
      new Map(
        (existenciasQuery.data ?? [])
          .filter((item) => item.ubicacion.tipo === "BODEGA")
          .map((item) => [item.material.id, Number(item.cantidad)]),
      ),
    [existenciasQuery.data],
  );
  const idsAgregados = new Set(filas.map((fila) => fila.materialId));
  const materialesDisponibles = (materialesQuery.data ?? []).filter(
    (material) =>
      material.estado &&
      !idsAgregados.has(material.id) &&
      (stockBodega.get(material.id) ?? 0) > 0,
  );
  const query = searchable(busqueda.trim());
  const materialesVisibles = materialesDisponibles.filter((material) =>
    searchable(
      [material.codigo, material.nombre, material.descripcion, material.unidad]
        .filter(Boolean)
        .join(" "),
    ).includes(query),
  );

  useEffect(() => {
    setFilas(
      isOpen
        ? proyecto.detalles.map((detalle) => ({
            materialId: detalle.material.id,
            cantidad: "0",
            claveOperacion: nuevaClave(),
            origen: "PRESUPUESTO" as const,
          }))
        : [],
    );
    setMaterialId("");
    setBusqueda("");
    setObservacion("");
    setError("");
  }, [isOpen, proyecto.detalles]);

  function agregarMaterial() {
    const id = Number(materialId);
    if (!id || idsAgregados.has(id)) return;
    setFilas((actuales) => [
      ...actuales,
      {
        materialId: id,
        cantidad: "0",
        claveOperacion: nuevaClave(),
        origen: "MANUAL",
      },
    ]);
    setMaterialId("");
    setBusqueda("");
    setError("");
  }

  function materialDe(
    fila: FilaEnvio,
  ): Pick<Material, "id" | "codigo" | "nombre" | "unidad"> | undefined {
    const catalogo = materialesQuery.data?.find(
      (material) => material.id === fila.materialId,
    );
    if (catalogo) return catalogo;
    const presupuesto = proyecto.detalles.find(
      (detalle) => detalle.material.id === fila.materialId,
    );
    return presupuesto
      ? {
          id: presupuesto.material.id,
          codigo: null,
          nombre: presupuesto.material.nombre,
          unidad: presupuesto.unidad,
        }
      : undefined;
  }

  function mostrarError(message: string) {
    setError(message);
    toast.danger(message, { timeout: 2000 });
  }

  async function enviar(event: FormEvent) {
    event.preventDefault();
    if (!filas.length) {
      mostrarError("Agrega al menos un material.");
      return;
    }
    for (const fila of filas) {
      const cantidad = Number(fila.cantidad);
      const disponible = stockBodega.get(fila.materialId) ?? 0;
      const material = materialDe(fila);
      if (!Number.isInteger(cantidad) || cantidad < 0) {
        mostrarError(
          `La cantidad de ${material?.nombre ?? "cada material"} debe ser un entero igual o mayor que cero.`,
        );
        return;
      }
      if (cantidad > disponible) {
        mostrarError(
          `${material?.nombre ?? "El material"} supera la existencia de bodega. Actualmente hay ${disponible.toLocaleString("es-SV")} ${material?.unidad ?? "unidades"}.`,
        );
        return;
      }
    }

    setPending(true);
    setError("");
    try {
      const filasParaEnviar = filas.filter((fila) => Number(fila.cantidad) > 0);
      if (!filasParaEnviar.length) {
        setPending(false);
        mostrarError("Ingresa una cantidad mayor que cero para enviar.");
        return;
      }
      const result = await registrarSalidaMaterialesProyecto({
        proyectoId: proyecto.id,
        materiales: filasParaEnviar.map((fila) => ({
          claveOperacion: fila.claveOperacion,
          materialId: fila.materialId,
          cantidad: Number(fila.cantidad),
        })),
        observacion: observacion.trim() || undefined,
      });
      await onSuccess();
      toast.success(
        result.repetido
          ? "El envío ya había sido registrado."
          : "Materiales enviados al proyecto.",
      );
      onOpenChange(false);
    } catch (requestError) {
      mostrarError(errorMovimientoMaterial(requestError));
    } finally {
      setPending(false);
    }
  }

  const loading = materialesQuery.isPending || existenciasQuery.isPending;
  const hasDataError = materialesQuery.isError || existenciasQuery.isError;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-h-[calc(100vh-2rem)] w-full overflow-hidden sm:max-w-3xl">
            <Modal.CloseTrigger />
            <Modal.Header>
              <div>
                <Modal.Heading>Enviar materiales</Modal.Heading>
                <p className="text-sm font-normal text-gray-600">
                  Los materiales cotizados aparecen con cantidad 0. Solo se
                  enviarán las cantidades mayores que cero.
                </p>
              </div>
            </Modal.Header>
            <form
              onSubmit={enviar}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <Modal.Body className="min-h-0 space-y-4 overflow-y-auto">
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-sky-700">
                    Proyecto destino
                  </span>
                  <p className="font-semibold text-sky-950">
                    {proyecto.nombre}
                  </p>
                </div>

                {loading ? (
                  <p className="rounded-lg bg-gray-100 p-3 text-sm text-gray-600">
                    Cargando materiales y existencias…
                  </p>
                ) : hasDataError ? (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    No se pudieron cargar los materiales disponibles.
                  </p>
                ) : (
                  <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
                    <ComboBox
                      items={materialesVisibles}
                      inputValue={busqueda}
                      selectedKey={materialId || null}
                      onInputChange={(value) => {
                        setBusqueda(value);
                        if (
                          materialId &&
                          value !==
                            materialesDisponibles.find(
                              (item) => item.id === Number(materialId),
                            )?.nombre
                        ) {
                          setMaterialId("");
                        }
                      }}
                      onSelectionChange={(key) => {
                        const id = String(key ?? "");
                        setMaterialId(id);
                        setBusqueda(
                          materialesDisponibles.find(
                            (item) => item.id === Number(id),
                          )?.nombre ?? "",
                        );
                      }}
                      allowsCustomValue={false}
                      menuTrigger="focus"
                      variant="secondary"
                      fullWidth
                    >
                      <Label>Buscar material</Label>
                      <MaterialComboBoxControl placeholder="Nombre, código, descripción o unidad" />
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
                                  {stockBodega
                                    .get(material.id)
                                    ?.toLocaleString("es-SV")}{" "}
                                  {material.unidad}
                                </span>
                              </div>
                            </ListBox.Item>
                          )}
                        </ListBox>
                      </ComboBox.Popover>
                    </ComboBox>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={agregarMaterial}
                      isDisabled={!materialId}
                    >
                      <Plus className="size-4" />
                      Agregar
                    </Button>
                  </div>
                )}

                {filas.length ? (
                  <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                    <Table>
                      <Table.ScrollContainer>
                        <Table.Content aria-label="Materiales del envío">
                          <Table.Header>
                            <Table.Column isRowHeader>Material</Table.Column>
                            <Table.Column>Origen</Table.Column>
                            <Table.Column>Disponible</Table.Column>
                            <Table.Column>Cantidad</Table.Column>
                            <Table.Column>Acciones</Table.Column>
                          </Table.Header>
                          <Table.Body>
                            <Table.Collection items={filas}>
                              {(fila: FilaEnvio) => {
                                const material = materialDe(fila);
                                return (
                                  <Table.Row key={fila.materialId}>
                                    <Table.Cell>
                                      <span className="font-medium">
                                        {material?.nombre}
                                      </span>
                                      <span className="block text-xs text-gray-500">
                                        {material?.codigo ||
                                          `#${fila.materialId}`}{" "}
                                        · {material?.unidad}
                                      </span>
                                    </Table.Cell>
                                    <Table.Cell>
                                      {fila.origen === "PRESUPUESTO" ? (
                                        <span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">
                                          Cotizado
                                        </span>
                                      ) : (
                                        <span className="text-xs text-gray-500">
                                          Agregado
                                        </span>
                                      )}
                                    </Table.Cell>
                                    <Table.Cell>
                                      {(
                                        stockBodega.get(fila.materialId) ?? 0
                                      ).toLocaleString("es-SV")}{" "}
                                      {material?.unidad}
                                    </Table.Cell>
                                    <Table.Cell>
                                      <InputField
                                        aria-label={`Cantidad de ${material?.nombre ?? "material"}`}
                                        type="number"
                                        min="0"
                                        step="1"
                                        inputMode="numeric"
                                        value={fila.cantidad}
                                        onChange={(event) =>
                                          setFilas((actuales) =>
                                            actuales.map((item) =>
                                              item.materialId ===
                                              fila.materialId
                                                ? {
                                                    ...item,
                                                    cantidad:
                                                      event.target.value,
                                                  }
                                                : item,
                                            ),
                                          )
                                        }
                                      />
                                    </Table.Cell>
                                    <Table.Cell>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="danger-soft"
                                        isIconOnly
                                        aria-label={`Quitar ${material?.nombre ?? "material"}`}
                                        onClick={() =>
                                          setFilas((actuales) =>
                                            actuales.filter(
                                              (item) =>
                                                item.materialId !==
                                                fila.materialId,
                                            ),
                                          )
                                        }
                                      >
                                        <Trash2 className="size-4" />
                                      </Button>
                                    </Table.Cell>
                                  </Table.Row>
                                );
                              }}
                            </Table.Collection>
                          </Table.Body>
                        </Table.Content>
                      </Table.ScrollContainer>
                    </Table>
                  </div>
                ) : (
                  !loading &&
                  !hasDataError && (
                    <p className="rounded-xl border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500">
                      Busca y agrega los materiales que deseas enviar.
                    </p>
                  )
                )}

                <TextAreaField
                  label="Observación"
                  placeholder="Detalle opcional para el historial"
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
                  onClick={() => onOpenChange(false)}
                  isDisabled={pending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isPending={pending}
                  isDisabled={
                    pending ||
                    loading ||
                    hasDataError ||
                    !filas.some((fila) => Number(fila.cantidad) > 0)
                  }
                >
                  Enviar materiales
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
