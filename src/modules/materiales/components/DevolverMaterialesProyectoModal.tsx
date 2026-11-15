import { InputField } from "@components/fields/InputField";
import { TextAreaField } from "@components/fields/TextAreaField";
import { Button } from "@heroui/react/button";
import { Modal } from "@heroui/react/modal";
import { Table } from "@heroui/react/table";
import { toast } from "@heroui/react/toast";
import type { ResumenMaterialProyecto } from "@modules/consumos-materiales/types/consumo-material";
import type { ProyectoDetalle } from "@modules/proyectos/types/proyectos";
import { useEffect, useState, type FormEvent } from "react";
import {
  errorMovimientoMaterial,
  registrarDevolucionMaterialesProyecto,
} from "../api/inventario-materiales";

type FilaDevolucion = {
  materialId: number;
  cantidad: string;
  claveOperacion: string;
};

const nuevaClave = () => globalThis.crypto.randomUUID();
const numero = (value: string | number) =>
  Number(value).toLocaleString("es-SV", { maximumFractionDigits: 2 });

export function DevolverMaterialesProyectoModal({
  proyecto,
  resumen,
  isOpen,
  onOpenChange,
  onSuccess,
}: {
  proyecto: Pick<ProyectoDetalle, "id" | "nombre">;
  resumen: ResumenMaterialProyecto[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
}) {
  const [filas, setFilas] = useState<FilaDevolucion[]>([]);
  const [observacion, setObservacion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFilas(
      isOpen
        ? resumen
            .filter((item) => Number(item.existenciaActual) > 0)
            .map((item) => ({
              materialId: item.material.id,
              cantidad: "0",
              claveOperacion: nuevaClave(),
            }))
        : [],
    );
    setObservacion("");
    setError("");
  }, [isOpen, resumen]);

  function resumenDe(materialId: number) {
    return resumen.find((item) => item.material.id === materialId);
  }

  function mostrarError(message: string) {
    setError(message);
    toast.danger(message, { timeout: 2000 });
  }

  async function devolver(event: FormEvent) {
    event.preventDefault();
    for (const fila of filas) {
      const item = resumenDe(fila.materialId);
      const cantidad = Number(fila.cantidad);
      const disponible = Number(item?.existenciaActual ?? 0);
      if (!Number.isInteger(cantidad) || cantidad < 0) {
        mostrarError(
          `La cantidad de ${item?.material.nombre ?? "cada material"} debe ser un entero igual o mayor que cero.`,
        );
        return;
      }
      if (cantidad > disponible) {
        mostrarError(
          `${item?.material.nombre ?? "El material"} supera la existencia del proyecto. Actualmente hay ${numero(disponible)} ${item?.material.unidad ?? "unidades"}.`,
        );
        return;
      }
    }

    const filasParaDevolver = filas.filter((fila) => Number(fila.cantidad) > 0);
    if (!filasParaDevolver.length) {
      mostrarError("Ingresa una cantidad mayor que cero para devolver.");
      return;
    }

    setPending(true);
    setError("");
    try {
      const result = await registrarDevolucionMaterialesProyecto({
        proyectoId: proyecto.id,
        materiales: filasParaDevolver.map((fila) => ({
          claveOperacion: fila.claveOperacion,
          materialId: fila.materialId,
          cantidad: Number(fila.cantidad),
        })),
        observacion: observacion.trim() || undefined,
      });
      await onSuccess();
      toast.success(
        result.repetido
          ? "La devolución ya había sido registrada."
          : "Materiales devueltos a bodega.",
      );
      onOpenChange(false);
    } catch (requestError) {
      mostrarError(errorMovimientoMaterial(requestError));
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-h-[calc(100vh-2rem)] w-full overflow-hidden sm:max-w-3xl">
            <Modal.CloseTrigger />
            <Modal.Header>
              <div>
                <Modal.Heading>Devolver materiales</Modal.Heading>
                <p className="text-sm font-normal text-gray-600">
                  Indica cuánto material regresará del proyecto a bodega.
                </p>
              </div>
            </Modal.Header>
            <form
              onSubmit={devolver}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <Modal.Body className="min-h-0 space-y-4 overflow-y-auto">
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-sky-700">
                    Proyecto de origen
                  </span>
                  <p className="font-semibold text-sky-950">
                    {proyecto.nombre}
                  </p>
                </div>

                {filas.length ? (
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <Table>
                      <Table.ScrollContainer>
                        <Table.Content
                          aria-label="Materiales disponibles para devolver"
                          className="min-w-full"
                        >
                          <Table.Header>
                            <Table.Column isRowHeader>Material</Table.Column>
                            <Table.Column>Disponible en proyecto</Table.Column>
                            <Table.Column>Cantidad a devolver</Table.Column>
                          </Table.Header>
                          <Table.Body>
                            <Table.Collection items={filas}>
                              {(fila: FilaDevolucion) => {
                                const item = resumenDe(fila.materialId);
                                return (
                                  <Table.Row key={fila.materialId}>
                                    <Table.Cell>
                                      <span className="font-medium">
                                        {item?.material.nombre}
                                      </span>
                                      <span className="block text-xs text-gray-500">
                                        {item?.material.unidad}
                                      </span>
                                    </Table.Cell>
                                    <Table.Cell>
                                      {numero(item?.existenciaActual ?? 0)}{" "}
                                      {item?.material.unidad}
                                    </Table.Cell>
                                    <Table.Cell>
                                      <InputField
                                        aria-label={`Cantidad a devolver de ${item?.material.nombre ?? "material"}`}
                                        type="number"
                                        min="0"
                                        max={String(
                                          Number(item?.existenciaActual ?? 0),
                                        )}
                                        step="1"
                                        inputMode="numeric"
                                        value={fila.cantidad}
                                        onChange={(event) =>
                                          setFilas((actuales) =>
                                            actuales.map((actual) =>
                                              actual.materialId ===
                                              fila.materialId
                                                ? {
                                                    ...actual,
                                                    cantidad:
                                                      event.target.value,
                                                  }
                                                : actual,
                                            ),
                                          )
                                        }
                                      />
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
                  <p className="rounded-xl border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500">
                    El proyecto no tiene materiales disponibles para devolver.
                  </p>
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
                    pending || !filas.some((fila) => Number(fila.cantidad) > 0)
                  }
                >
                  Devolver materiales
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
