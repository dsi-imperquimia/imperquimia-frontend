import { InputField } from "@components/fields/InputField";
import { TextAreaField } from "@components/fields/TextAreaField";
import { Button } from "@heroui/react/button";
import { Checkbox } from "@heroui/react/checkbox";
import { ComboBox } from "@heroui/react/combo-box";
import { Label } from "@heroui/react/label";
import { ListBox } from "@heroui/react/list-box";
import { Modal } from "@heroui/react/modal";
import { toast } from "@heroui/react/toast";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  errorConsumoMaterial,
  registrarConsumoMaterial,
} from "../api/consumos-materiales";
import type { ResumenMaterialProyecto } from "../types/consumo-material";
import { MaterialComboBoxControl } from "@modules/materiales/components/MaterialComboBoxControl";

const nuevaClave = () => globalThis.crypto.randomUUID();
const hoy = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/El_Salvador",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

function searchable(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

export function RegistrarConsumoModal({
  proyectoId,
  isOpen,
  onOpenChange,
  resumen,
  onSuccess,
}: {
  proyectoId: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  resumen: ResumenMaterialProyecto[];
  onSuccess: () => Promise<void>;
}) {
  const disponibles = useMemo(
    () => resumen.filter((item) => Number(item.existenciaActual) > 0),
    [resumen],
  );
  const [materialId, setMaterialId] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [fechaJornada, setFechaJornada] = useState(hoy);
  const [esMerma, setEsMerma] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [claveOperacion, setClaveOperacion] = useState(nuevaClave);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const seleccionado = disponibles.find(
    (item) => item.material.id === Number(materialId),
  );
  const query = searchable(materialSearch.trim());
  const visibles = disponibles.filter((item) => {
    if (item.material.id === seleccionado?.material.id) return true;
    return searchable(
      [item.material.codigo, item.material.nombre, item.material.unidad]
        .filter(Boolean)
        .join(" "),
    ).includes(query);
  });

  useEffect(() => {
    if (isOpen) setError("");
  }, [isOpen]);

  function reset() {
    setMaterialId("");
    setMaterialSearch("");
    setCantidad("");
    setFechaJornada(hoy());
    setEsMerma(false);
    setMotivo("");
    setClaveOperacion(nuevaClave());
    setError("");
  }

  function handleOpenChange(open: boolean) {
    if (isPending) return;
    onOpenChange(open);
    if (!open) reset();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const cantidadNumero = Number(cantidad);
    if (!seleccionado) return setError("Selecciona un material.");
    if (!Number.isInteger(cantidadNumero) || cantidadNumero <= 0) {
      return setError("Ingresa una cantidad entera mayor que cero.");
    }
    if (cantidadNumero > Number(seleccionado.existenciaActual)) {
      return setError(
        `La cantidad supera el saldo del proyecto. Actualmente hay ${Number(seleccionado.existenciaActual).toLocaleString("es-SV", { maximumFractionDigits: 2 })} ${seleccionado.material.unidad}.`,
      );
    }
    if (esMerma && !motivo.trim()) {
      return setError("Explica el motivo de la merma.");
    }

    setIsPending(true);
    setError("");
    try {
      const result = await registrarConsumoMaterial({
        claveOperacion,
        proyectoId,
        materialId: seleccionado.material.id,
        cantidad: cantidadNumero,
        clasificacion: esMerma ? "PERDIDA" : "PRODUCCION",
        fechaJornada,
        motivo: motivo.trim() || undefined,
      });
      await onSuccess();
      toast.success(
        result.repetido
          ? "El consumo ya había sido registrado."
          : esMerma
            ? "Merma registrada con éxito."
            : "Consumo registrado con éxito.",
      );
      onOpenChange(false);
      reset();
    } catch (requestError) {
      setError(errorConsumoMaterial(requestError));
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
                <Modal.Heading>Registrar consumo de material</Modal.Heading>
                <p className="text-sm font-normal text-gray-500">
                  El consumo se descontará de la existencia actual del proyecto.
                </p>
              </div>
            </Modal.Header>
            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <Modal.Body className="min-h-0 space-y-4 overflow-y-auto">
                {disponibles.length ? (
                  <ComboBox
                    items={visibles}
                    inputValue={materialSearch}
                    selectedKey={materialId || null}
                    onInputChange={(value) => {
                      setMaterialSearch(value);
                      if (
                        seleccionado &&
                        value !== seleccionado.material.nombre
                      ) {
                        setMaterialId("");
                      }
                    }}
                    onSelectionChange={(key) => {
                      const id = String(key ?? "");
                      setMaterialId(id);
                      setMaterialSearch(
                        disponibles.find(
                          (item) => item.material.id === Number(id),
                        )?.material.nombre ?? "",
                      );
                    }}
                    allowsCustomValue={false}
                    menuTrigger="focus"
                    variant="secondary"
                    fullWidth
                    isRequired
                  >
                    <Label>Material</Label>
                    <MaterialComboBoxControl placeholder="Busca un material con saldo" />
                    <ComboBox.Popover>
                      <ListBox items={visibles}>
                        {(item) => (
                          <ListBox.Item
                            id={String(item.material.id)}
                            textValue={item.material.nombre}
                          >
                            <div className="flex w-full justify-between gap-4">
                              <span>{item.material.nombre}</span>
                              <span className="text-xs text-gray-500">
                                Disponible:{" "}
                                {Number(item.existenciaActual).toLocaleString(
                                  "es-SV",
                                  {
                                    maximumFractionDigits: 2,
                                  },
                                )}{" "}
                                {item.material.unidad}
                              </span>
                            </div>
                          </ListBox.Item>
                        )}
                      </ListBox>
                    </ComboBox.Popover>
                  </ComboBox>
                ) : (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    El proyecto no tiene materiales disponibles para consumir.
                  </p>
                )}

                {seleccionado && (
                  <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800">
                    Disponible actualmente:{" "}
                    <strong>
                      {Number(seleccionado.existenciaActual).toLocaleString(
                        "es-SV",
                        { maximumFractionDigits: 2 },
                      )}{" "}
                      {seleccionado.material.unidad}
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
                  <InputField
                    label="Fecha de jornada"
                    type="date"
                    value={fechaJornada}
                    onChange={(event) => setFechaJornada(event.target.value)}
                    isRequired
                  />
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <Checkbox
                    isSelected={esMerma}
                    onChange={setEsMerma}
                    aria-label="Es merma"
                  >
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Label>Es merma</Label>
                    </Checkbox.Content>
                  </Checkbox>
                  <p className="mt-1 text-xs text-gray-500">
                    Marca esta opción cuando el material se perdió, dañó o ya no
                    puede reutilizarse.
                  </p>
                </div>

                {esMerma && (
                  <TextAreaField
                    label="Motivo de la merma"
                    placeholder="Describe por qué se perdió o desperdició el material"
                    value={motivo}
                    onChange={(event) => setMotivo(event.target.value)}
                    isRequired
                  />
                )}

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
                  isDisabled={isPending || !disponibles.length}
                >
                  Registrar {esMerma ? "merma" : "consumo"}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
