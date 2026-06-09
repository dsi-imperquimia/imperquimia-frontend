import React from "react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { Wrench, Tag, Layers } from "lucide-react";

import { InputField } from "@components/fields/InputField";
import { parseErrorApiUseForm } from "@modules/core/utils/parseErrorApi";
import { createHerramienta } from "../api/createHerramienta";
import type { Herramienta } from "../types/herramientas";

interface Props {
  onSuccess?: (herramienta: Herramienta) => void;
}

export function FormHerramienta({ onSuccess }: Props) {
  const form = useForm({
    defaultValues: {
      nombre: "",
      marca: "",
      tipo: "",
    },
    onSubmit: async ({ value, formApi }) => {
      const nuevaHerramienta = await createHerramienta(value).catch((error) => {
        formApi.setErrorMap(
          parseErrorApiUseForm(error, "Error al dar de alta la herramienta")
        );
      });

      if (!nuevaHerramienta) return;

      toast.success(`Herramienta "${nuevaHerramienta.nombre}" registrada con código ${nuevaHerramienta.codigoUnico}`);
      onSuccess?.(nuevaHerramienta);
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <form.Field
          name="nombre"
          validators={{
            onChange: ({ value }) => {
              if (!value) return "El nombre de la herramienta es requerido";
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
            onChange: ({ value }) => (!value ? "La marca es requerida" : undefined),
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
            onChange: ({ value }) => (!value ? "El tipo o clasificación es requerido" : undefined),
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
      </div>

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
                className="bg-gray-900 text-white mt-2"
              >
                {isSubmitting ? "Registrando..." : "Guardar herramienta"}
              </Button>
            </>
          );
        }}
      </form.Subscribe>
    </form>
  );
}