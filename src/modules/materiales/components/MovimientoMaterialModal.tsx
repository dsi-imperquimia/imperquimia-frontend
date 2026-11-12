import { InputField } from "@components/fields/InputField";
import { SelectedField } from "@components/fields/SelectedField";
import { TextAreaField } from "@components/fields/TextAreaField";
import { Button } from "@heroui/react/button";
import { ListBox } from "@heroui/react/list-box";
import { Modal } from "@heroui/react/modal";
import { toast } from "@heroui/react/toast";
import type { Material } from "@modules/materiales/types/material";
import type { Proyecto } from "@modules/proyectos/types/proyectos";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import {
  errorMovimientoMaterial,
  registrarMovimientoMaterial,
} from "../api/inventario-materiales";
import {
  MOTIVO_LABEL,
  type MotivoMovimientoMaterial,
} from "../types/inventario-material";

type TipoFormulario = "ENTRADA" | "SALIDA";

const MOTIVOS: Record<TipoFormulario, MotivoMovimientoMaterial[]> = {
  ENTRADA: ["COMPRA", "DEVOLUCION_PROYECTO", "OTRO"],
  SALIDA: ["USO_PROYECTO", "VENTA", "OTRO"],
};

const nuevaClave = () => globalThis.crypto.randomUUID();

export function MovimientoMaterialModal({
  tipo,
  isOpen,
  onOpenChange,
  materiales,
  proyectos,
  onSuccess,
}: {
  tipo: TipoFormulario;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  materiales: Material[];
  proyectos: Proyecto[];
  onSuccess: () => Promise<void>;
}) {
  const [materialId, setMaterialId] = useState("");
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
  const requiereObservacion = motivo === "OTRO";

  useEffect(() => {
    setMotivo(MOTIVOS[tipo][0]);
    setProyectoId("");
    setError(undefined);
  }, [tipo, isOpen]);

  function reset() {
    setMaterialId("");
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
    if (requiereObservacion && !observacion.trim()) {
      return setError("Describe el motivo del movimiento.");
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

  const Icon = tipo === "ENTRADA" ? ArrowDownToLine : ArrowUpFromLine;
  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="w-full sm:max-w-2xl">
            <Modal.CloseTrigger />
            <Modal.Header className="flex items-center gap-3">
              <Modal.Icon className="bg-gray-100 text-gray-600">
                <Icon className="size-5" />
              </Modal.Icon>
              <div>
                <Modal.Heading>
                  Registrar {tipo === "ENTRADA" ? "entrada" : "salida"}
                </Modal.Heading>
                <p className="text-sm font-normal text-gray-500">
                  El saldo y el historial se actualizarán en una sola operación.
                </p>
              </div>
            </Modal.Header>
            <form onSubmit={handleSubmit}>
              <Modal.Body className="space-y-4">
                <SelectedField
                  label="Material"
                  placeholder="Selecciona un material"
                  selectedKey={materialId || null}
                  onSelectionChange={(key) => setMaterialId(String(key ?? ""))}
                  isRequired
                >
                  {materiales.map((material) => (
                    <ListBox.Item
                      key={material.id}
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
                  ))}
                </SelectedField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="Cantidad"
                    type="number"
                    min="0.01"
                    step="0.01"
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
                    {proyectos
                      .filter((proyecto) => proyecto.estado !== "CANCELADO")
                      .map((proyecto) => (
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

                <TextAreaField
                  label={
                    requiereObservacion
                      ? "Descripción del motivo"
                      : "Observación"
                  }
                  placeholder="Detalle opcional para la auditoría"
                  value={observacion}
                  onChange={(event) => setObservacion(event.target.value)}
                  isRequired={requiereObservacion}
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
