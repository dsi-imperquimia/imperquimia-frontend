import React, { useEffect } from "react"; 
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@heroui/react/button";
import { Select, Label, Description, ListBox } from "@heroui/react";
import { toast } from "@heroui/react/toast";
import { FileText, ArrowRightLeft } from "lucide-react";

import { InputField } from "@components/fields/InputField";
import { parseErrorApiUseForm } from "@modules/core/utils/parseErrorApi";
import { createMovimiento } from "../api/createMovimiento";
import { listProyectos } from "@/modules/proyectos/api/listProyectos";
import { AreaMovimiento } from "../types/movimientos";
import type { Herramienta } from "@/modules/herramientas/types/herramientas";

interface Props {
  herramienta: Herramienta;
  onSuccess?: () => void;
}

export function FormMovimiento({ herramienta, onSuccess }: Props) {
  const { data: proyectos = [], error: proyectosError } = useQuery({
    queryKey: ["proyectos-select"],
    queryFn: listProyectos,
  });

  useEffect(() => {
    if (!proyectosError) return;
    toast.danger("Error al cargar frentes de obra. Inténtalo de nuevo.");
  }, [proyectosError]);

  const form = useForm({
    defaultValues: {
      herramientaId: herramienta.id,
      origen: herramienta.proyectoId ? AreaMovimiento.PROYECTO : AreaMovimiento.BODEGA,
      destino: AreaMovimiento.BODEGA, // Inicializamos con un valor por defecto del enum para evitar quejas de tipo undefined
      proyectoDestinoId: undefined as number | undefined,
      conDano: false,
      observaciones: "",
    },
    onSubmit: async ({ value, formApi }) => {
      if (value.destino !== AreaMovimiento.BODEGA) {
        value.conDano = false;
      }

      const movimiento = await createMovimiento(value).catch((error) => {
        formApi.setErrorMap(
          parseErrorApiUseForm(error, "Error al registrar la transacción logística"),
        );
      });

      if (!movimiento) return;

      toast.success(`Herramienta reubicada con éxito a ${value.destino}`);
      onSuccess?.();
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-1">
      <div className="rounded-lg bg-gray-50 border border-gray-100 p-3.5 text-xs text-gray-600 space-y-1">
        <p><strong>Equipo:</strong> {herramienta.nombre} ({herramienta.marca})</p>
        <p><strong>Código Único:</strong> <span className="font-mono bg-white px-1 border rounded">{herramienta.codigoUnico}</span></p>
        <p><strong>Ubicación Actual (Origen):</strong> <span className="font-semibold text-gray-900">{herramienta.proyecto?.nombre || "BODEGA GENERAL"}</span></p>
      </div>

      {/* Selector: Destino de traslado */}
      <form.Field
        name="destino"
        validators={{
          onChange: ({ value }) => {
            if (!value) return "El destino logístico es requerido";
            return undefined;
          },
        }}
      >
        {(field) => (
          <div className="space-y-1">
            <Label>Destino de traslado</Label>
            <Select
              // CORRECCIÓN: Usamos selectedKey (singular, string directo) según indica tu compilador
              selectedKey={String(field.state.value)}
              placeholder="Selecciona el área de destino"
              variant="secondary"
              // CORRECCIÓN: Extraemos el valor directo sin estructuras Set
              onSelectionChange={(val) => {
                if (!val) return;
                const nuevoDestino = val as AreaMovimiento;
                field.handleChange(nuevoDestino);
                
                // CORRECCIÓN: Reseteo idiomático y tipado seguro con form.setFieldValue
                form.setFieldValue("proyectoDestinoId", undefined);
              }}
            >
              <Select.Trigger className="w-full">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Description>Área física que recibirá el activo custodio.</Description>
              <Select.Popover>
                <ListBox>
                  {Object.values(AreaMovimiento).map((area) => (
                    <ListBox.Item key={area} id={area} textValue={area}>
                      {area}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-red-600">{field.state.meta.errors.join(", ")}</p>
            )}
          </div>
        )}
      </form.Field>

      {/* Selector Dinámico: Proyecto Destino (Solo visible si va a PROYECTO) */}
      <form.Subscribe selector={(state) => state.values.destino}>
        {(destino) => {
          if (destino !== AreaMovimiento.PROYECTO) return null;

          return (
            <form.Field
              name="proyectoDestinoId"
              validators={{
                onChange: ({ value }) => {
                  if (!value && form.getFieldValue("destino") === AreaMovimiento.PROYECTO) {
                    return "Debes asignar un proyecto obligatoriamente";
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-1">
                  <Label>Proyecto Destino</Label>
                  <Select
                    // CORRECCIÓN: Sincronización en singular usando strings directos
                    selectedKey={field.state.value !== undefined ? String(field.state.value) : ""}
                    placeholder="Selecciona el proyecto asignado"
                    variant="secondary"
                    onSelectionChange={(val) => {
                      field.handleChange(val ? Number(val) : undefined);
                    }}
                  >
                    <Select.Trigger className="w-full">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Description>Obra civil de Imperquimia que asumirá la custodia.</Description>
                    <Select.Popover>
                      <ListBox>
                        {proyectos.map((p) => (
                          <ListBox.Item key={p.id} id={String(p.id)} textValue={p.nombre}>
                            {p.nombre}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-600">{field.state.meta.errors.join(", ")}</p>
                  )}
                </div>
              )}
            </form.Field>
          );
        }}
      </form.Subscribe>

      <form.Subscribe selector={(state) => state.values.destino}>
        {(destino) => {
          if (destino !== AreaMovimiento.BODEGA) return null;

          return (
            <form.Field name="conDano">
              {(field) => (
                <label className="inline-flex items-center gap-2.5 text-sm bg-red-50 border border-red-100 rounded-xl p-3 text-red-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(field.state.value)}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="font-semibold block text-xs">¿El equipo ingresa dañado?</span>
                    <span className="text-[11px] text-red-700 block mt-0.5">Cambiará el estatus del activo a "DAÑADA" para auditoría inmediata.</span>
                  </div>
                </label>
              )}
            </form.Field>
          );
        }}
      </form.Subscribe>

      <form.Field name="observaciones">
        {(field) => (
          <InputField
            label="Observaciones y Justificación"
            type="text"
            placeholder="Ej. Envío por solicitud de residente de obra"
            startContent={<FileText className="size-4 text-muted" />}
            value={field.state.value || ""}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
          />
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          isSubmitting: state.isSubmitting,
          errorMap: state.errorMap,
        })}
      >
        {({ canSubmit, isSubmitting, errorMap }) => {
          const error = errorMap.onSubmit || errorMap.onServer;
          return (
            <>
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                isDisabled={!canSubmit}
                isPending={isSubmitting}
                className="bg-gray-950 text-white mt-2 w-full flex items-center justify-center gap-2"
              >
                {!isSubmitting && <ArrowRightLeft className="size-4" />}
                <span>{isSubmitting ? "Procesando..." : "Confirmar Movimiento"}</span>
              </Button>
            </>
          );
        }}
      </form.Subscribe>
    </form>
  );
}