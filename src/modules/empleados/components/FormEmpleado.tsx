import { InputField } from "@components/fields/InputField";
import { Button } from "@heroui/react/button";
import { Select, Label, Description, ListBox} from "@heroui/react";
import { toast } from "@heroui/react/toast";
import { parseErrorApiUseForm } from "@modules/core/utils/parseErrorApi";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { User } from "lucide-react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { listCargos } from "@modules/cargo-empleado/api/list-cargos";
import { storeEmpleado } from "../api/store-empleado";
import type { Cargo } from "@modules/cargo-empleado/types/cargo";
import type { Empleado as EmpleadoType } from "../types/empleado";

interface Props {
  empleado?: Partial<EmpleadoType>;
}

export function FormEmpleado({ empleado: empleadoInit }: Props) {
  const navigate = useNavigate();
  const { data: cargos = [], error: cargosError } = useQuery<Cargo[]>({
    queryKey: ["cargo-empleado"],
    queryFn: listCargos,
  });

  useEffect(() => {
    if (!cargosError) return;

    toast.danger("Error al cargar los cargos. Por favor, inténtalo de nuevo.");
  }, [cargosError]);

  const form = useForm({
    defaultValues: empleadoInit ?? {},
    onSubmit: async ({ value, formApi }) => {
      const empleado = await storeEmpleado(value).catch((error) => {
        formApi.setErrorMap(
          parseErrorApiUseForm(error, "Error al guardar empleado"),
        );
      });

      toast.success("Empleado guardado correctamente");

      if (!(empleadoInit?.id === undefined && empleado?.id)) return;
      navigate({ to: `/empleados/${empleado?.id}` });
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
              type="text"
              placeholder="Ingresa el nombre completo"
              startContent={<User className="size-4 text-muted" />}
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

        <form.Field
          name="dui"
          validators={{
            onChange: ({ value }) => {
              if (!value) return "El DUI es requerido";
              return undefined;
            },
          }}
        >
          {(field) => (
            <InputField
              label="DUI"
              type="text"
              placeholder="Ingresa el DUI"
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

        <form.Field
          name="nit"
          validators={{
            onChange: ({ value }) => {
              if (!value) return "El NIT es requerido";
              return undefined;
            },
          }}
        >
          {(field) => (
            <InputField
              label="NIT"
              type="text"
              placeholder="Ingresa el NIT"
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

        <form.Field
          name="cargoId"
          validators={{
            onChange: ({ value }) => {
              if (value === undefined || value === null )
                return "El cargo es requerido";
              return undefined;
            },
          }}
        >
          {(field) => (
            <div className="space-y-1">
              <Label>Cargo de empleado</Label>
              <Select
                value={field.state.value}
                onChange={(value) => {
                  console.log("Selected cargo:", value);
                  field.handleChange(value === "" ? undefined : Number(value))
                }}
                placeholder="Selecciona un cargo"
                variant= "secondary"
              >
                <Select.Trigger className="w-full">
                  <Select.Value  />
                  <Select.Indicator />
                </Select.Trigger>
                <Description>Elige el cargo asignado al empleado.</Description>
                <Select.Popover>
                  <ListBox>
                    {cargos.map((cargo) => (
                      <ListBox.Item key={cargo.id} id={cargo.id} textValue={cargo.nombre}>
                        {cargo.nombre}
                        <ListBox.ItemIndicator/>
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
                {isSubmitting ? "Guardando..." : "Guardar empleado"}
              </Button>
            </>
          );
        }}
      />
    </form>
  );
}
