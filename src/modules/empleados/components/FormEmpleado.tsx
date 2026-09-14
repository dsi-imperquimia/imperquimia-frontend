import { DuiInputField } from "@components/fields/DuiInputField";
import { InputField } from "@components/fields/InputField";
import { NitInputField } from "@components/fields/NitInputField";
import { Description, Label, ListBox, Select } from "@heroui/react";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { listCargos } from "@modules/cargo-empleado/api/list-cargos";
import type { Cargo } from "@modules/cargo-empleado/types/cargo";
import { isValidDui, isValidNit } from "@modules/core/utils/masks";
import { parseErrorApiUseForm } from "@modules/core/utils/parseErrorApi";
import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { User } from "lucide-react";
import { useEffect, useState } from "react";
import { storeEmpleado } from "../api/store-empleado";
import type { Empleado as EmpleadoType } from "../types/empleado";
import { SeccionHabilidadesEmpleado } from "./SeccionHabilidadesEmpleado";

interface Props {
  empleado?: Partial<EmpleadoType>;
}

function formValues(empleado?: Partial<EmpleadoType>) {
  return {
    nombreCompleto: empleado?.nombreCompleto ?? "",
    dui: empleado?.dui ?? "",
    nit: empleado?.nit ?? "",
    cargoId: empleado?.cargoId,
    activo: empleado?.activo ?? true,
    habilidadesIds:
      empleado?.habilidades?.map(({ habilidadId }) => habilidadId) ?? [],
  };
}

export function FormEmpleado({ empleado: empleadoInit }: Props) {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string>();
  const { data: cargos = [], error: cargosError } = useQuery<Cargo[]>({
    queryKey: ["cargo-empleado"],
    queryFn: listCargos,
  });

  useEffect(() => {
    if (!cargosError) return;

    toast.danger("Error al cargar los cargos. Por favor, inténtalo de nuevo.");
  }, [cargosError]);

  const form = useForm({
    defaultValues: formValues(empleadoInit),
    onSubmit: async ({ value, formApi }) => {
      if (value.cargoId === undefined) return;
      setSubmitError(undefined);
      let empleado: EmpleadoType;
      try {
        empleado = await storeEmpleado({
          ...value,
          id: empleadoInit?.id,
          cargoId: value.cargoId,
        });
      } catch (error) {
        const errors = parseErrorApiUseForm(error, "Error al guardar empleado");
        formApi.setErrorMap(errors);
        setSubmitError(errors.onSubmit.form);
        return;
      }

      // El loader se refresca después; sus valores anteriores no deben sobrescribir
      // la respuesta guardada durante ese intervalo.
      formApi.reset(formValues(empleado), { keepDefaultValues: true });
      toast.success("Empleado guardado correctamente");
      void queryClient.invalidateQueries({ queryKey: ["empleados"] });

      if (empleadoInit?.id === undefined) {
        void navigate({
          to: "/empleados/$empleadoId",
          params: { empleadoId: empleado.id },
        });
      } else {
        void router.invalidate();
      }
    },
  });

  const isSaving = useStore(form.store, (state) => state.isSubmitting);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    void form.handleSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <fieldset disabled={isSaving} className="flex flex-col gap-4">
        <form.Field
          name="nombreCompleto"
          validators={{
            onChange: ({ value }) => {
              if (!value) return "El nombre completo es requerido";
              if (value.length < 3) return "Mínimo 3 caracteres";
              return undefined;
            },
          }}
        >
          {(field) => (
            <InputField
              label="Nombre completo"
              isRequired
              type="text"
              placeholder="Ingresa el nombre completo"
              startContent={<User className="size-4 text-muted" />}
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
          name="dui"
          validators={{
            onChange: ({ value }) => {
              if (!value) return "El DUI es requerido";
              if (!isValidDui(value)) return "DUI inválido";
              return undefined;
            },
          }}
        >
          {(field) => (
            <DuiInputField
              isRequired
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
          name="nit"
          validators={{
            onChange: ({ value }) => {
              if (!value) return "El NIT es requerido";
              if (!isValidNit(value)) return "NIT inválido";
              return undefined;
            },
          }}
        >
          {(field) => (
            <NitInputField
              isRequired
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
          name="cargoId"
          validators={{
            onChange: ({ value }) => {
              if (value === undefined) return "El cargo es requerido";
              return undefined;
            },
          }}
        >
          {(field) => (
            <div className="space-y-1">
              <Label isRequired>Cargo de empleado</Label>
              <Select
                aria-label="Cargo de empleado"
                value={field.state.value ?? null}
                isDisabled={isSaving}
                onChange={(value) => {
                  field.handleChange(
                    value === "" || value === null ? undefined : Number(value),
                  );
                }}
                placeholder="Selecciona un cargo"
                variant="secondary"
              >
                <Select.Trigger className="w-full">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Description>Elige el cargo asignado al empleado.</Description>
                <Select.Popover>
                  <ListBox>
                    {cargos.map((cargo) => (
                      <ListBox.Item
                        key={cargo.id}
                        id={cargo.id}
                        textValue={cargo.nombre}
                      >
                        {cargo.nombre}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-red-600">
                  {field.state.meta.errors.join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="activo">
          {(field) => (
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(field.state.value)}
                onChange={(e) => field.handleChange(e.target.checked)}
                onBlur={field.handleBlur}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
              />
              <span>Activo</span>
            </label>
          )}
        </form.Field>
        <form.Field name="habilidadesIds">
          {(field) => (
            <SeccionHabilidadesEmpleado
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              errorMessage={
                field.state.meta.errors.length > 0
                  ? field.state.meta.errors.join(", ")
                  : undefined
              }
              isDisabled={isSaving}
            />
          )}
        </form.Field>
      </fieldset>

      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          isSubmitting: state.isSubmitting,
        })}
        children={({ canSubmit, isSubmitting }) => {
          return (
            <>
              {submitError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {submitError}
                </p>
              )}
              <Button
                type="submit"
                isDisabled={!canSubmit || isSubmitting}
                isPending={isSubmitting}
                className="bg-gray-900"
              >
                {isSubmitting ? "Guardando..." : "Guardar empleado"}
              </Button>
            </>
          );
        }}
      />
    </form>
  );
}
