import { InputField } from "@components/fields/InputField";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { parseErrorApiUseForm } from "@modules/core/utils/parseErrorApi";
import { formatPhone, PHONE_MASK } from "@modules/core/utils/masks";

import { createCotizacion } from "../api/create-cotizacion";
import { updateCotizacion } from "../api/update-cotizacion";
import type { CotizacionDetalle } from "../types/cotizacion";

import type { Material } from "@modules/materiales/types/material";
import { listMateriales } from "@modules/materiales/api/list-materiales";
import { MaterialPickerModal } from "./material-picker-modal";

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

function calcularImportes(cantidad: number, costoUnitario: number) {
  const subTotal = cantidad * costoUnitario;
  const iva = subTotal * 0.13;
  return { subTotal, iva, total: subTotal + iva };
}

function validateDescripcion(value: string) {
  if (!value.trim()) return "La descripción es obligatoria";
  if (value.trim().length < 10) return "Mínimo 10 caracteres";
  if (value.length > 255) return "Máximo 255 caracteres";
}

function validateCliente(value: string) {
  if (!value.trim()) return "El cliente es obligatorio";
  if (value.trim().length < 3) return "Mínimo 3 caracteres";
  if (value.length > 100) return "Máximo 100 caracteres";
}

function validatePhone(value: string) {
  if (!value.trim()) return "El teléfono es obligatorio";
  if (!/^\d{8}$/.test(value))
    return "El teléfono debe tener exactamente 8 dígitos";
}

function validateEmail(value: string) {
  if (!value.trim()) return "El correo es obligatorio";
  if (value.length > 150) return "Máximo 150 caracteres";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
    return "Ingresa un correo electrónico válido";
}

function validateCantidad(value: string) {
  if (!value.trim()) return "La cantidad es obligatoria.";
  if (!/^\d+$/.test(value)) return "La cantidad debe ser un número entero.";
  const cantidad = Number(value);
  if (!Number.isSafeInteger(cantidad))
    return "La cantidad debe ser un número entero.";
  if (cantidad < 1) return "La cantidad debe ser al menos 1.";
  if (cantidad > 1000) return "La cantidad no puede superar 1000.";
}

function stepCantidad(value: string, step: 1 | -1) {
  if (value === "" && step === 1) return "1";
  if (validateCantidad(value)) return null;
  const next = Number(value) + step;
  return next >= 1 && next <= 1000 ? String(next) : null;
}

function phoneInputValue(value: string) {
  return /^\d{0,8}$/.test(value) ? formatPhone(value) : value;
}

function normalizeSavedPhone(value: string) {
  return /^\d{4}-\d{4}$/.test(value) ? value.replace("-", "") : value;
}

interface CotizacionFormValues {
  descripcion: string;
  cliente: string;
  phone: string;
  email: string;
  detalles: { materialId: string; cantidad: string }[];
}

function validateCotizacion(values: CotizacionFormValues) {
  const fields: Record<string, string[]> = {};
  const details: Record<string, string> = {};
  const checks = {
    descripcion: validateDescripcion(values.descripcion),
    cliente: validateCliente(values.cliente),
    phone: validatePhone(values.phone),
    email: validateEmail(values.email),
  };

  Object.entries(checks).forEach(([field, error]) => {
    if (error) fields[field] = [error];
  });

  if (values.detalles.length === 0) {
    details.detalles = "Agrega al menos un material.";
  }

  const seleccionados = new Set<number>();
  values.detalles.forEach((detalle, index) => {
    const materialId = Number(detalle.materialId);
    if (!Number.isInteger(materialId) || materialId <= 0) {
      details[`detalles[${index}].materialId`] = "Selecciona un material.";
    } else if (seleccionados.has(materialId)) {
      details[`detalles[${index}].materialId`] =
        "Este material ya está en otra fila.";
    } else {
      seleccionados.add(materialId);
    }

    const cantidadError = validateCantidad(detalle.cantidad);
    if (cantidadError) details[`detalles[${index}].cantidad`] = cantidadError;
  });

  return { fields, details };
}

export function FormCotizacion({ cotizacion: cotizacionInit }: Props) {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string>();
  const [serverErrors, setServerErrors] = useState<
    Partial<Record<string, string[]>>
  >({});
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

  function clearServerError(field: string) {
    setServerErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setSubmitError(undefined);
  }

  const {
    data: materiales = [],
    error: materialesError,
    isLoading: materialesLoading,
    refetch: refetchMateriales,
  } = useQuery<Material[]>({
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
      phone: normalizeSavedPhone(cotizacionInit?.phone ?? ""),
      email: cotizacionInit?.email ?? "",
      detalles:
        cotizacionInit?.detalles?.map((detalle) => ({
          materialId: detalle.materialId.toString(),
          cantidad: String(detalle.cantidad),
        })) ?? [],
    },

    onSubmit: async ({ value }) => {
      const detalles = value.detalles.map((detalle) => ({
        materialId: Number(detalle.materialId),
        cantidad: Number(detalle.cantidad),
      }));

      const payload = {
        descripcion: value.descripcion,
        cliente: value.cliente,
        phone: value.phone,
        email: value.email,
        detalles,
      };
      try {
        const cotizacionGuardada = cotizacionInit?.id
          ? await updateCotizacion(cotizacionInit.id, payload)
          : await createCotizacion(payload);

        toast.success("Cotización guardada correctamente");
        void navigate({
          to: "/cotizaciones/$cotizacionId/view",
          params: { cotizacionId: cotizacionGuardada.id.toString() },
        });
      } catch (error) {
        const parsed = parseErrorApiUseForm(
          error,
          "Error al guardar la cotización.",
        );
        setServerErrors(parsed.onSubmit.fields);
        setSubmitError(
          Object.keys(parsed.onSubmit.fields).length > 0
            ? "Revisa los campos señalados."
            : parsed.onSubmit.form,
        );
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    const { fields, details } = validateCotizacion(form.state.values);
    setServerErrors(fields);
    setDetailErrors(details);
    if (Object.keys(fields).length > 0 || Object.keys(details).length > 0) {
      setSubmitError("Revisa los campos señalados.");
      return;
    }
    setSubmitError(undefined);
    void form.handleSubmit();
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
            <p className="font-medium">
              {formatDate(cotizacionInit.createdAt)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Última modificación</p>
            <p className="font-medium">
              {formatDate(cotizacionInit.updatedAt)}
            </p>
          </div>
        </div>
      )}

      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        <form.Field
          name="descripcion"
          validators={{
            onChange: ({ value }) => validateDescripcion(value),
          }}
        >
          {(field) => (
            <InputField
              label="Descripción"
              type="text"
              placeholder="Ingresa la descripción"
              value={field.state.value}
              onChange={(e) => {
                field.handleChange(e.target.value);
                clearServerError("descripcion");
              }}
              onBlur={field.handleBlur}
              errorMessage={
                field.state.meta.errors.length > 0
                  ? field.state.meta.errors.join(", ")
                  : serverErrors.descripcion?.join(", ")
              }
            />
          )}
        </form.Field>

        <form.Field
          name="cliente"
          validators={{
            onChange: ({ value }) => validateCliente(value),
          }}
        >
          {(field) => (
            <InputField
              label="Cliente"
              type="text"
              placeholder="Ingresa el cliente"
              value={field.state.value}
              onChange={(e) => {
                field.handleChange(e.target.value);
                clearServerError("cliente");
              }}
              onBlur={field.handleBlur}
              errorMessage={
                field.state.meta.errors.length > 0
                  ? field.state.meta.errors.join(", ")
                  : serverErrors.cliente?.join(", ")
              }
            />
          )}
        </form.Field>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        <form.Field
          name="phone"
          validators={{
            onChange: ({ value }) => validatePhone(value),
          }}
        >
          {(field) => (
            <InputField
              label="Teléfono"
              type="tel"
              inputMode="numeric"
              placeholder={PHONE_MASK}
              value={phoneInputValue(field.state.value)}
              onChange={(e) => {
                field.handleChange(e.target.value.replace(/\D/g, ""));
                clearServerError("phone");
              }}
              onBlur={field.handleBlur}
              errorMessage={
                field.state.meta.errors.length > 0
                  ? field.state.meta.errors.join(", ")
                  : serverErrors.phone?.join(", ")
              }
            />
          )}
        </form.Field>

        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => validateEmail(value),
          }}
        >
          {(field) => (
            <InputField
              label="Email"
              type="email"
              placeholder="Ingresa el correo electronico"
              value={field.state.value}
              onChange={(e) => {
                field.handleChange(e.target.value);
                clearServerError("email");
              }}
              onBlur={field.handleBlur}
              errorMessage={
                field.state.meta.errors.length > 0
                  ? field.state.meta.errors.join(", ")
                  : serverErrors.email?.join(", ")
              }
            />
          )}
        </form.Field>
      </div>

      <form.Field name="detalles" mode="array">
        {() => (
          <form.Subscribe
            selector={(state) => state.values.detalles}
            children={(detalles) => {
              const filas = detalles.map((detalle, index) => {
                const material = materiales.find(
                  (item) => item.id === Number(detalle.materialId),
                );
                const costoUnitario = Number(material?.costoUnitario ?? 0);
                const importes = calcularImportes(
                  validateCantidad(detalle.cantidad)
                    ? 0
                    : Number(detalle.cantidad),
                  costoUnitario,
                );
                return {
                  index,
                  material,
                  costoUnitario,
                  importes,
                };
              });
              const resumen = filas.reduce(
                (total, fila) => ({
                  subTotal: total.subTotal + fila.importes.subTotal,
                  iva: total.iva + fila.importes.iva,
                  total: total.total + fila.importes.total,
                }),
                { subTotal: 0, iva: 0, total: 0 },
              );

              return (
                <section className="flex w-full flex-col gap-4">
                  <div>
                    <h2 className="font-semibold">
                      Materiales de la cotización
                    </h2>
                    <p className="text-sm text-gray-500">
                      Los cálculos son una vista previa. Al guardar, el sistema
                      recalcula y almacena los valores finales.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsMaterialModalOpen(true)}
                    >
                      Agregar material
                    </Button>
                  </div>

                  {filas.length > 0 ? (
                    <div className="w-full rounded-xl border border-gray-200 bg-white">
                      <table className="w-full table-fixed text-sm max-lg:block">
                        <thead className="bg-gray-50 text-left text-gray-600 max-lg:hidden">
                          <tr>
                            <th scope="col" className="w-[4%] px-2 py-3">
                              #
                            </th>
                            <th scope="col" className="w-[28%] px-2 py-3">
                              Material
                            </th>
                            <th scope="col" className="w-[12%] px-2 py-3">
                              Cantidad
                            </th>
                            <th
                              scope="col"
                              className="w-[12%] px-2 py-3 text-right"
                            >
                              Precio unitario
                            </th>
                            <th
                              scope="col"
                              className="w-[12%] px-2 py-3 text-right"
                            >
                              Subtotal
                            </th>
                            <th
                              scope="col"
                              className="w-[9%] px-2 py-3 text-right"
                            >
                              IVA
                            </th>
                            <th
                              scope="col"
                              className="w-[12%] px-2 py-3 text-right"
                            >
                              Total
                            </th>
                            <th
                              scope="col"
                              className="w-[11%] px-2 py-3 text-right"
                            >
                              Acción
                            </th>
                          </tr>
                        </thead>
                        <tbody className="block divide-y divide-gray-200 lg:table-row-group">
                          {filas.map(
                            ({ index, material, costoUnitario, importes }) => {
                              const cantidadName =
                                `detalles[${index}].cantidad` as const;
                              return (
                                <tr
                                  key={index}
                                  className="grid grid-cols-2 gap-3 p-3 align-top lg:table-row lg:p-0"
                                >
                                  <th
                                    scope="row"
                                    className="hidden px-2 py-4 font-medium lg:table-cell"
                                  >
                                    {index + 1}
                                  </th>
                                  <td className="col-span-2 min-w-0 px-2 py-1 lg:table-cell lg:py-3">
                                    <span className="mb-1 block text-xs font-semibold text-gray-600 lg:hidden">
                                      Material #{index + 1}
                                    </span>
                                    <div className="space-y-1">
                                      <p className="break-words font-medium">
                                        {material?.nombre ??
                                          "Material no disponible"}
                                      </p>
                                      {material?.descripcion && (
                                        <p className="break-words text-xs text-gray-500">
                                          {material.descripcion}
                                        </p>
                                      )}
                                      <p className="text-xs text-gray-500">
                                        Unidad: {material?.unidad ?? "—"}
                                      </p>
                                      {detailErrors[
                                        `detalles[${index}].materialId`
                                      ] && (
                                        <p
                                          className="text-xs text-red-600"
                                          role="alert"
                                        >
                                          {
                                            detailErrors[
                                              `detalles[${index}].materialId`
                                            ]
                                          }
                                        </p>
                                      )}
                                    </div>
                                  </td>
                                  <td className="col-span-2 min-w-0 px-2 py-1 lg:table-cell lg:py-3">
                                    <span className="mb-1 block text-xs text-gray-500 lg:hidden">
                                      Cantidad
                                    </span>
                                    <form.Field
                                      name={cantidadName}
                                      validators={{
                                        onChange: ({ value }) =>
                                          validateCantidad(value),
                                      }}
                                    >
                                      {(field) => {
                                        function updateCantidad(value: string) {
                                          field.handleChange(value);
                                          setDetailErrors((current) => {
                                            const next = { ...current };
                                            delete next[cantidadName];
                                            return next;
                                          });
                                          clearServerError("cantidad");
                                        }

                                        return (
                                          <InputField
                                            aria-label={`Cantidad fila ${index + 1}`}
                                            type="text"
                                            inputMode="numeric"
                                            value={field.state.value}
                                            onChange={(event) =>
                                              updateCantidad(event.target.value)
                                            }
                                            onKeyDown={(event) => {
                                              if (
                                                event.key !== "ArrowUp" &&
                                                event.key !== "ArrowDown"
                                              )
                                                return;
                                              event.preventDefault();
                                              const next = stepCantidad(
                                                field.state.value,
                                                event.key === "ArrowUp"
                                                  ? 1
                                                  : -1,
                                              );
                                              if (next !== null)
                                                updateCantidad(next);
                                            }}
                                            onBlur={field.handleBlur}
                                            errorMessage={
                                              detailErrors[cantidadName] ??
                                              field.state.meta.errors.join(", ")
                                            }
                                          />
                                        );
                                      }}
                                    </form.Field>
                                  </td>
                                  <td className="min-w-0 px-2 py-1 lg:table-cell lg:py-4 lg:text-right">
                                    <span className="block text-xs text-gray-500 lg:hidden">
                                      Precio unitario
                                    </span>
                                    {money(costoUnitario)}
                                  </td>
                                  <td className="min-w-0 px-2 py-1 text-right lg:table-cell lg:py-4">
                                    <span className="block text-xs text-gray-500 lg:hidden">
                                      Subtotal
                                    </span>
                                    {money(importes.subTotal)}
                                  </td>
                                  <td className="min-w-0 px-2 py-1 lg:table-cell lg:py-4 lg:text-right">
                                    <span className="block text-xs text-gray-500 lg:hidden">
                                      IVA
                                    </span>
                                    {money(importes.iva)}
                                  </td>
                                  <td className="min-w-0 px-2 py-1 text-right font-semibold lg:table-cell lg:py-4">
                                    <span className="block text-xs font-normal text-gray-500 lg:hidden">
                                      Total
                                    </span>
                                    {money(importes.total)}
                                  </td>
                                  <td className="col-span-2 px-2 py-1 text-right lg:table-cell lg:py-3">
                                    <Button
                                      type="button"
                                      variant="danger"
                                      size="sm"
                                      onClick={() => {
                                        form.setFieldValue(
                                          "detalles",
                                          form.state.values.detalles.filter(
                                            (_, itemIndex) =>
                                              itemIndex !== index,
                                          ),
                                        );
                                        setDetailErrors({});
                                        clearServerError("detalles");
                                        setSubmitError(undefined);
                                      }}
                                    >
                                      Quitar
                                    </Button>
                                  </td>
                                </tr>
                              );
                            },
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
                      Aún no hay materiales. Usa “Agregar material” para
                      elegirlos.
                    </p>
                  )}

                  {detailErrors.detalles && (
                    <p className="text-sm text-red-600" role="alert">
                      {detailErrors.detalles}
                    </p>
                  )}

                  <MaterialPickerModal
                    isOpen={isMaterialModalOpen}
                    onOpenChange={setIsMaterialModalOpen}
                    materiales={materiales}
                    isLoading={materialesLoading}
                    hasError={Boolean(materialesError)}
                    onRetry={() => void refetchMateriales()}
                    selectedIds={
                      new Set(
                        detalles.map((detalle) => Number(detalle.materialId)),
                      )
                    }
                    onAdd={(materialId) => {
                      form.setFieldValue("detalles", [
                        { materialId: materialId.toString(), cantidad: "1" },
                        ...form.state.values.detalles,
                      ]);
                      setDetailErrors({});
                      clearServerError("detalles");
                    }}
                  />

                  {(serverErrors.detalles ||
                    serverErrors.materialId ||
                    serverErrors.cantidad) && (
                    <p className="text-sm text-red-600" role="alert">
                      {[
                        ...(serverErrors.detalles ?? []),
                        ...(serverErrors.materialId ?? []),
                        ...(serverErrors.cantidad ?? []),
                      ].join(" ")}
                    </p>
                  )}

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
                </section>
              );
            }}
          />
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) => state.isSubmitting}
        children={(isSubmitting) => (
          <>
            {submitError && (
              <p
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
                role="alert"
              >
                {submitError}
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
        )}
      />
    </form>
  );
}
