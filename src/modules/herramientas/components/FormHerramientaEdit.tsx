import React from "react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { useNavigate } from "@tanstack/react-router";
import { Wrench, Tag, Layers } from "lucide-react";

import { InputField } from "@components/fields/InputField";
import { parseErrorApiUseForm } from "@modules/core/utils/parseErrorApi";
import { updateHerramienta } from "../api/updateHerramienta";
import type { Herramienta } from "../types/herramientas";

interface Props {
  herramienta: Herramienta;
}

export function FormHerramientaEdit({ herramienta }: Props) {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      nombre: herramienta.nombre,
      marca: herramienta.marca,
      tipo: herramienta.tipo,
    },
    onSubmit: async ({ value, formApi }) => {
      const updated = await updateHerramienta(herramienta.id, value).catch(
        (error) => {
          formApi.setErrorMap(
            parseErrorApiUseForm(error, "Error al actualizar la herramienta"),
          );
        },
      );

      if (!updated) return;

      toast.success(`Herramienta "${updated.nombre}" actualizada con éxito.`);
      void navigate({
        to: "/herramientas/$herramientaId/view",
        params: { herramientaId: herramienta.id.toString() },
      });
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
      {/* Info no editable */}
      <div className="rounded-lg bg-gray-50 border border-gray-100 p-3.5 text-xs text-gray-600 space-y-1">
        <p>
          <strong>Código Único (inmutable):</strong>{" "}
          <span className="font-mono bg-white px-1 border rounded">
            {herramienta.codigoUnico}
          </span>
        </p>
        <p>
          <strong>Estado actual:</strong>{" "}
          <span className="font-semibold text-gray-900">
            {herramienta.estado.replace("_", " ")}
          </span>{" "}
          — El estado solo cambia mediante traslados.
        </p>
      </div>

      <form.Field
        name="nombre"
        validators={{
          onChange: ({ value }) => {
            if (!value) return "El nombre es requerido";
            if (value.length < 3) return "Mínimo 3 caracteres";
            return undefined;
          },
        }}
      >
        {(field) => (
          <InputField
            label="Nombre de la Herramienta"
            type="text"
            placeholder="Ej. Rotomartillo Inalámbrico"
            startContent={<Wrench className="size-4 text-muted" />}
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
        name="marca"
        validators={{
          onChange: ({ value }) =>
            !value ? "La marca es requerida" : undefined,
        }}
      >
        {(field) => (
          <InputField
            label="Marca"
            type="text"
            placeholder="Ej. DeWalt, Bosch, Makita"
            startContent={<Tag className="size-4 text-muted" />}
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
        name="tipo"
        validators={{
          onChange: ({ value }) =>
            !value ? "El tipo es requerido" : undefined,
        }}
      >
        {(field) => (
          <InputField
            label="Tipo de Herramienta"
            type="text"
            placeholder="Ej. Eléctrica, Neumática, Manual"
            startContent={<Layers className="size-4 text-muted" />}
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
              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant="tertiary"
                  className="flex-1"
                  onClick={() => window.history.back()}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isDisabled={!canSubmit}
                  isPending={isSubmitting}
                  className="bg-gray-950 text-white flex-1"
                >
                  {isSubmitting ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </>
          );
        }}
      </form.Subscribe>
    </form>
  );
}
