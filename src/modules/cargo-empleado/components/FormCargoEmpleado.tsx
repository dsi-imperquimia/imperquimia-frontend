import { InputField } from "@components/fields/InputField";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { parseErrorApiUseForm } from "@modules/core/utils/parseErrorApi";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { Briefcase } from "lucide-react";
import { storeCargo } from "../api/store-cargo";
import type { Cargo } from "../types/cargo";

interface Props {
  cargo?: Partial<Cargo>;
}

export function FormCargoEmpleado({ cargo: cargoInit }: Props) {
  const isEdit = Boolean(cargoInit?.id);
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: cargoInit ?? {},
    onSubmit: async ({ value, formApi }) => {
      const cargo = await storeCargo(value).catch((error) => {
        formApi.setErrorMap(
          parseErrorApiUseForm(error, "Error al guardar cargo"),
        );
      });

      toast.success("Cargo guardado correctamente");

      if (!(cargoInit?.id === undefined && cargo?.id)) return;
      navigate({ to: `/cargo-empleado/${cargo?.id}` });
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
              if (!value) return "El nombre es requerido";
              if (value.length < 3) return "Mínimo 3 caracteres";
              return undefined;
            },
          }}
        >
          {(field) => (
            <InputField
              label="Nombre"
              isRequired
              type="text"
              placeholder="Ingresa el nombre del cargo"
              startContent={<Briefcase className="size-4 text-muted" />}
              value={field.state.value as string}
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
        children={({ canSubmit, isSubmitting, errorMap }) => {
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
                className="bg-gray-900"
              >
                {isSubmitting ? "Guardando..." : "Guardar cargo"}
              </Button>
            </>
          );
        }}
      />
    </form>
  );
}
