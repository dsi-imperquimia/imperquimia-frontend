import { InputField } from "@components/fields/InputField";
import { Button } from "@heroui/react/button";
import { Select, Label, Description, ListBox } from "@heroui/react";
import { toast } from "@heroui/react/toast";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { createCotizacion } from "../api/create-cotizacion";
import { updateCotizacion } from "../api/update-cotizacion";
import type { CotizacionDetalle } from "../types/cotizacion";

import type { Material } from "@modules/materiales/types/material";
import { listMateriales } from "@modules/materiales/api/list-materiales";

interface Props {
  cotizacion?: Partial<CotizacionDetalle>;
}

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatDate(date?: string) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("es-SV");
}

export function FormCotizacion({ cotizacion: cotizacionInit }: Props) {
  const navigate = useNavigate();

  const { data: materiales = [], error: materialesError } = useQuery<
    Material[]
  >({
    queryKey: ["materiales"],
    queryFn: listMateriales,
  });

  useEffect(() => {
    if (!materialesError) return;
    toast.danger("Error al cargar los materiales.");
  }, [materialesError]);

  const form = useForm({
    defaultValues: {
      descripcion: cotizacionInit?.descripcion ?? "",
      cliente: cotizacionInit?.cliente ?? "",
      phone: cotizacionInit?.phone ?? "",
      email: cotizacionInit?.email ?? "",
      detalles:
        cotizacionInit?.detalles?.map((detalle) => ({
          materialId: detalle.materialId.toString(),
          cantidad: Number(detalle.cantidad),
        })) ?? [
          {
            materialId: "",
            cantidad: 1,
          },
        ],
    },

    onSubmit: async ({ value }) => {
      const detalles = value.detalles.map((detalle) => ({
        materialId: Number(detalle.materialId),
        cantidad: Number(detalle.cantidad),
      }));

      const hayMaterialVacio = detalles.some(
        (detalle) => !detalle.materialId || detalle.materialId <= 0,
      );

      if (hayMaterialVacio) {
        toast.danger("Debes seleccionar un material en todos los detalles.");
        return;
      }

      const hayCantidadInvalida = detalles.some(
        (detalle) => !detalle.cantidad || detalle.cantidad <= 0,
      );

      if (hayCantidadInvalida) {
        toast.danger("La cantidad debe ser mayor a 0.");
        return;
      }

      const materialIds = detalles.map((detalle) => detalle.materialId);
      const hayRepetidos = new Set(materialIds).size !== materialIds.length;

      if (hayRepetidos) {
        toast.danger("No puedes agregar el mismo material más de una vez.");
        return;
      }

      let cotizacionGuardada;

      if (cotizacionInit?.id) {
        cotizacionGuardada = await updateCotizacion(cotizacionInit.id, {
          descripcion: value.descripcion,
          cliente: value.cliente,
          phone: value.phone,
          email: value.email,
          detalles,
        });
      } else {
        cotizacionGuardada = await createCotizacion({
          descripcion: value.descripcion,
          cliente: value.cliente,
          phone: value.phone,
          email: value.email,
          detalles,
        });
      }

      toast.success("Cotización guardada correctamente");

      navigate({
        to: "/cotizaciones/$cotizacionId/view",
        params: {
          cotizacionId: cotizacionGuardada.id.toString(),
        },
      });
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      {cotizacionInit?.id && (
        <div className="grid w-full grid-cols-1 gap-4 rounded-xl border bg-gray-50 p-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500">Creada por</p>
            <p className="font-medium">
              {cotizacionInit.user?.name} {cotizacionInit.user?.lastName}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Fecha de creación</p>
            <p className="font-medium">{formatDate(cotizacionInit.createdAt)}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Última modificación</p>
            <p className="font-medium">{formatDate(cotizacionInit.updatedAt)}</p>
          </div>
        </div>
      )}

      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        <form.Field
          name="descripcion"
          validators={{
            onChange: ({ value }) => {
              if (!value.trim()) return "La descripción es requerida";
              if (value.trim().length < 10) return "Mínimo 10 caracteres";
              if (value.trim().length > 500) return "Máximo 500 caracteres";
              return undefined;
            },
          }}
        >
          {(field) => (
            <InputField
              label="Descripción"
              type="text"
              placeholder="Ingresa la descripción"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              errorMessage={
                field.state.meta.errors.length > 0
                  ? field.state.meta.errors.join(", ")
                  : undefined
              }
            />
          )}
        </form.Field>

        <form.Field
          name="cliente"
          validators={{
            onChange: ({ value }) => {
              if (!value.trim()) return "El cliente es requerido";
              if (value.trim().length < 3) return "Mínimo 3 caracteres";
              if (value.trim().length > 100) return "Máximo 100 caracteres";
              return undefined;
            },
          }}
        >
          {(field) => (
            <InputField
              label="Cliente"
              type="text"
              placeholder="Ingresa el cliente"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              errorMessage={
                field.state.meta.errors.length > 0
                  ? field.state.meta.errors.join(", ")
                  : undefined
              }
            />
          )}
        </form.Field>
      </div>

        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        <form.Field
          name="phone"
          validators={{
            onChange: ({ value }) => {
              if (!value.trim()) return "El número de teléfono es requerido";
              if (!/^\d+$/.test(value.trim())) return "Solo se permiten números";
              if (value.trim().length !== 8) return "El teléfono debe tener 8 dígitos";
              return undefined;
            },
          }}
        >
          {(field) => (
            <InputField
              label="Teléfono"
              type="text"
              placeholder="Ingresa el número de teléfono"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              errorMessage={
                field.state.meta.errors.length > 0
                  ? field.state.meta.errors.join(", ")
                  : undefined
              }
            />
          )}
        </form.Field>

        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => {
              if (!value.trim()) return "El correo electronico es requerido";
              if (value.trim().length > 150) return "Máximo 150 caracteres";
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
                return "Ingrese un correo electrónico válido";
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <InputField
              label="Email"
              type="email"
              placeholder="Ingresa el correo electronico"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              errorMessage={
                field.state.meta.errors.length > 0
                  ? field.state.meta.errors.join(", ")
                  : undefined
              }
            />
          )}
        </form.Field>
      </div>

      {/* cotizacionInit?.id && (
        <form.Field name="estado">
          {(field) => (
            <div className="w-full max-w-md space-y-1">
              <Label>Estado</Label>
              <Select
                value={field.state.value}
                onChange={(value) =>
                  field.handleChange(value as EstadoCotizacion)
                }
                placeholder="Selecciona estado"
                variant="secondary"
              >
                <Select.Trigger className="w-full">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>

                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="ACTIVA" textValue="ACTIVA">
                      ACTIVA
                      <ListBox.ItemIndicator />
                    </ListBox.Item>

                    <ListBox.Item id="DESACTIVADA" textValue="DESACTIVADA">
                      DESACTIVADA
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          )}
        </form.Field>
      ) */}

      <form.Field name="detalles" mode="array">
        {() => (
          <form.Subscribe
            selector={(state) => state.values.detalles}
            children={(detalles) => {
              const resumen = detalles.reduce(
                (acc, detalle) => {
                  const material = materiales.find(
                    (item) => item.id === Number(detalle.materialId),
                  );

                  const cantidad = Number(detalle.cantidad || 0);
                  const costoUnitario = Number(material?.costoUnitario || 0);
                  const subTotal = cantidad * costoUnitario;
                  const iva = subTotal * 0.13;
                  const total = subTotal + iva;

                  return {
                    subTotal: acc.subTotal + subTotal,
                    iva: acc.iva + iva,
                    total: acc.total + total,
                  };
                },
                {
                  subTotal: 0,
                  iva: 0,
                  total: 0,
                },
              );

              return (
                <div className="flex w-full flex-col gap-4">
                  <div>
                    <Label>Materiales de la cotización</Label>
                    <p className="text-sm text-gray-500">
                    Los cálculos mostrados son una vista previa. Al guardar, 
                    el sistema recalcula y almacena los valores finales.
                    </p>
                  </div>

                  {detalles.map((detalle, index) => {
                    const materialSeleccionado = materiales.find(
                      (material) =>
                        material.id === Number(detalle.materialId),
                    );

                    const cantidad = Number(detalle.cantidad || 0);
                    const costoUnitario = Number(
                      materialSeleccionado?.costoUnitario || 0,
                    );
                    const subTotal = cantidad * costoUnitario;
                    const iva = subTotal * 0.13;
                    const total = subTotal + iva;

                    const materialesSeleccionados = detalles
                      .map((item, itemIndex) =>
                        itemIndex !== index ? item.materialId : "",
                      )
                      .filter((id) => id !== "")
                      .map(Number);

                    const materialesDisponibles = materiales.filter(
                      (material) =>
                        !materialesSeleccionados.includes(material.id),
                    );

                    return (
                      <div
                        key={index}
                        className="w-full rounded-xl border bg-white p-4 shadow-sm"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="font-medium">
                            Material #{index + 1}
                          </h3>

                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            isDisabled={detalles.length === 1}
                            onClick={() => {
                              form.setFieldValue(
                                "detalles",
                                form.state.values.detalles.filter(
                                  (_, i) => i !== index,
                                ),
                              );
                            }}
                          >
                            Quitar
                          </Button>
                        </div>

                        <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-12">
                          <form.Field
                            name={`detalles[${index}].materialId`}
                            validators={{
                              onChange: ({ value }) => {
                                if (!value) return "El material es requerido";
                                return undefined;
                              },
                            }}
                          >
                            {(materialField) => (
                              <div className="space-y-1 lg:col-span-4">
                                <Label>Material</Label>
                                <Select
                                  value={String(
                                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                                    materialField.state.value ?? "",
                                  )}
                                  onChange={(value) =>
                                    materialField.handleChange(String(value))
                                  }
                                  placeholder="Selecciona material"
                                  variant="secondary"
                                >
                                  <Select.Trigger className="w-full">
                                    <Select.Value />
                                    <Select.Indicator />
                                  </Select.Trigger>

                                  <Description>
                                    No puedes seleccionar materiales repetidos.
                                  </Description>

                                  <Select.Popover>
                                    <ListBox>
                                      {materialesDisponibles.map((material) => (
                                        <ListBox.Item
                                          key={material.id}
                                          id={material.id.toString()}
                                          textValue={material.nombre}
                                        >
                                          {material.nombre}
                                          <ListBox.ItemIndicator />
                                        </ListBox.Item>
                                      ))}
                                    </ListBox>
                                  </Select.Popover>
                                </Select>

                                {materialField.state.meta.errors.length > 0 && (
                                  <p className="text-sm text-red-600">
                                    {materialField.state.meta.errors.join(", ")}
                                  </p>
                                )}
                              </div>
                            )}
                          </form.Field>

                          <form.Field
                            name={`detalles[${index}].cantidad`}
                            validators={{
                              onChange: ({ value }) => {
                                if (!value) return "La cantidad es requerida";
                                if (Number(value) <= 0)
                                  return "Debe ser mayor a 0";
                                return undefined;
                              },
                            }}
                          >
                            {(cantidadField) => (
                              <div className="lg:col-span-2">
                                <InputField
                                  label="Cantidad"
                                  type="number"
                                  placeholder="Cantidad"
                                  value={String(cantidadField.state.value)}
                                  onChange={(e) =>
                                    cantidadField.handleChange(
                                      Number(e.target.value),
                                    )
                                  }
                                  onBlur={cantidadField.handleBlur}
                                  errorMessage={
                                    cantidadField.state.meta.errors.length > 0
                                      ? cantidadField.state.meta.errors.join(
                                          ", ",
                                        )
                                      : undefined
                                  }
                                />
                              </div>
                            )}
                          </form.Field>

                          <div className="rounded-lg bg-gray-50 p-3 lg:col-span-6">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                              <div>
                                <p className="text-xs text-gray-500">Unidad</p>
                                <p className="font-medium">
                                  {materialSeleccionado?.unidad ?? "N/A"}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-gray-500">
                                  Costo unitario
                                </p>
                                <p className="font-medium">
                                  {money(costoUnitario)}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-gray-500">
                                  Subtotal
                                </p>
                                <p className="font-medium">
                                  {money(subTotal)}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-gray-500">IVA</p>
                                <p className="font-medium">{money(iva)}</p>
                              </div>

                              <div>
                                <p className="text-xs text-gray-500">Total</p>
                                <p className="font-semibold">{money(total)}</p>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-lg bg-gray-50 p-3 lg:col-span-12">
                            <p className="text-xs text-gray-500">
                              Descripción del material
                            </p>
                            <p className="font-medium">
                              {materialSeleccionado?.descripcion ??
                                "Selecciona un material para ver la descripción."}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex justify-between gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      isDisabled={detalles.length >= materiales.length}
                      onClick={() => {
                        form.setFieldValue("detalles", [
                          ...form.state.values.detalles,
                          {
                            materialId: "",
                            cantidad: 1,
                          },
                        ]);
                      }}
                    >
                      Agregar material
                    </Button>

                    {detalles.length >= materiales.length && (
                      <p className="text-sm text-gray-500">
                        Ya agregaste todos los materiales disponibles.
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <div className="w-full max-w-md space-y-2 rounded-xl border bg-gray-50 p-4">
                      <div className="flex justify-between">
                        <span>Subtotal general</span>
                        <strong>{money(resumen.subTotal)}</strong>
                      </div>

                      <div className="flex justify-between">
                        <span>IVA general</span>
                        <strong>{money(resumen.iva)}</strong>
                      </div>

                      <div className="flex justify-between border-t pt-2 text-lg">
                        <span>Total general</span>
                        <strong>{money(resumen.total)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) => ({
          isSubmitting: state.isSubmitting,
          errorMap: state.errorMap,
        })}
        children={({ isSubmitting, errorMap }) => {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          const error = errorMap.onSubmit || errorMap.onServer;

          return (
            <>
            {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  isDisabled={isSubmitting}
                  isPending={isSubmitting}
                  className="bg-gray-900"
                >
                  {isSubmitting ? "Guardando..." : "Guardar cotización"}
                </Button>
              </div>
            </>
          );
        }}
      />
    </form>
  );
}