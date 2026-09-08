import { InputField } from "@components/fields/InputField";
import { Button } from "@heroui/react/button";
import { Checkbox } from "@heroui/react/checkbox";
import { CheckboxGroup } from "@heroui/react/checkbox-group";
import { Description } from "@heroui/react/description";
import { Label } from "@heroui/react/label";
import { toast } from "@heroui/react/toast";
import { parseErrorApiUseForm } from "@modules/core/utils/parseErrorApi";
import { storeRole } from "@modules/user/api/roles/store-role";
import type { Permission } from "@modules/user/types/permission";
import type { Role as RoleType } from "@modules/user/types/roles";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";

interface FormRoleProps {
  role?: Partial<RoleType>;
  permissions?: Permission[];
}

export function FormRole({ role: roleInit, permissions = [] }: FormRoleProps) {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: roleInit ?? {},
    onSubmit: async ({ value, formApi }) => {
      const role = await storeRole(value).catch((error) => {
        formApi.setErrorMap(
          parseErrorApiUseForm(error, "Error al guardar rol"),
        );
      });

      toast.success("Rol guardado correctamente");

      if (!(roleInit?.id === undefined && role?.id)) return;
      navigate({ to: `/users/roles/${role?.id}` });
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
          name="name"
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
              type="text"
              placeholder="Ingresa el nombre"
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
          name="description"
          validators={{
            onChange: ({ value }) => {
              if (!value) return "La descripción es requerida";
              if (value.length < 5) return "Mínimo 5 caracteres";
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
        <form.Field name="permissionsIds">
          {(field) => {
            const selected = field.state.value ?? [];
            return (
              <div>
                <Checkbox
                  isIndeterminate={
                    selected.length > 0 && selected.length < permissions.length
                  }
                  isSelected={selected.length === permissions.length}
                  name="select-all"
                  onChange={(isSelected: boolean) => {
                    field.handleChange(
                      isSelected ? permissions.map((p) => p.id) : [],
                    );
                  }}
                >
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Content>
                    <Label>Seleccionar todos los permisos</Label>
                  </Checkbox.Content>
                </Checkbox>
                <div className="ml-6 flex flex-col gap-2">
                  <CheckboxGroup
                    name="permissions"
                    value={field.state.value?.map(String)}
                    onChange={(value) => field.handleChange(value.map(Number))}
                  >
                    {permissions?.map((permission) => (
                      <Checkbox
                        key={permission.id}
                        value={permission.id.toString()}
                      >
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Content>
                          <Label>{permission.name}</Label>
                          <Description>{permission.description}</Description>
                        </Checkbox.Content>
                      </Checkbox>
                    ))}
                  </CheckboxGroup>
                </div>
              </div>
            );
          }}
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
              >
                {isSubmitting ? "Guardando..." : "Guardar rol"}
              </Button>
            </>
          );
        }}
      />
    </form>
  );
}
