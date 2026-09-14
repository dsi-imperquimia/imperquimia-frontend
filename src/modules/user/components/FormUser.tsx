import { EmailInputField } from "@components/fields/EmailInputField";
import { InputField } from "@components/fields/InputField";
import { PasswordInputField } from "@components/fields/PasswordInputField";
import { SelectedField } from "@components/fields/SelectedField";
import { Button } from "@heroui/react/button";
import { Checkbox } from "@heroui/react/checkbox";
import { CheckboxGroup } from "@heroui/react/checkbox-group";
import { Description } from "@heroui/react/description";
import { Label } from "@heroui/react/label";
import { ListBox } from "@heroui/react/list-box";
import { Tabs } from "@heroui/react/tabs";
import { toast } from "@heroui/react/toast";
import { parseErrorApiUseForm } from "@modules/core/utils/parseErrorApi";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { User } from "lucide-react";
import { storeUser } from "../api/store-user";
import type { Permission } from "../types/permission";
import type { Role } from "../types/roles";
import type { User as UserType } from "../types/user";

interface Props {
  user?: Partial<UserType>;
  roles?: Role[];
  permissions?: Permission[];
}

export function FormUser({ user: userInit, roles, permissions = [] }: Props) {
  const isEdit = Boolean(userInit?.id);
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: userInit ?? {},
    onSubmit: async ({ value, formApi }) => {
      const user = await storeUser(value).catch((error) => {
        formApi.setErrorMap(
          parseErrorApiUseForm(error, "Error al guardar usuario"),
        );
      });

      toast.success("Usuario guardado correctamente");

      if (!(userInit?.id === undefined && user?.id)) return;
      navigate({ to: `/users/${user.id}` });
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Tabs className="w-full max-w-md" variant="secondary">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Options">
            <Tabs.Tab id="usuario">
              Usuario
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="permissions">
              Permisos
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel className="pt-4" id="usuario">
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
                  isRequired
                  type="text"
                  placeholder="Ingresa el nombre"
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
              name="lastName"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return "El apellido es requerido";
                  if (value.length < 3) return "Mínimo 3 caracteres";
                  return undefined;
                },
              }}
            >
              {(field) => (
                <InputField
                  label="Apellido"
                  isRequired
                  type="text"
                  placeholder="Ingresa el apellido"
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
              name="email"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return "El correo es requerido";
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
                    return "Correo inválido";
                  return undefined;
                },
              }}
            >
              {(field) => (
                <EmailInputField
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
              name="roleId"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return "El role es requerido";
                  return undefined;
                },
              }}
            >
              {(field) => (
                <SelectedField
                  label="Role"
                  isRequired
                  placeholder="Elige un role para el usuario"
                  value={field.state.value}
                  onChange={(value) =>
                    field.handleChange(value === "" ? undefined : Number(value))
                  }
                  onBlur={field.handleBlur}
                  errorMessage={
                    field.state.meta.errors.length > 0
                      ? field.state.meta.errors.join(", ")
                      : undefined
                  }
                >
                  {roles?.map((role) => (
                    <ListBox.Item
                      key={role.id}
                      id={role.id}
                      textValue={role.name}
                    >
                      {role.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </SelectedField>
              )}
            </form.Field>

            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) => {
                  if (isEdit && !value) return undefined; // Permitir no cambiar contraseña en edición
                  if (!value) return "La contraseña es requerida";
                  if (value.length < 8) return "Mínimo 8 caracteres";
                  return undefined;
                },
              }}
            >
              {(field) => (
                <PasswordInputField
                  isRequired={!isEdit}
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
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="permissions">
          <form.Subscribe selector={(state) => state.values.roleId}>
            {(roleId) => {
              // Toda tu lógica dependiente del estado va aquí dentro
              const roleSelected = roles?.find((r) => r.id === roleId);
              const permissionsRoleSelected =
                roleSelected?.permissionsIds ?? [];

              return (
                <form.Field name="permissionsIds">
                  {(field) => {
                    const selected = field.state.value ?? [];
                    return (
                      <div>
                        <Checkbox
                          isIndeterminate={
                            selected.length > 0 &&
                            selected.length < permissions.length
                          }
                          isSelected={selected.length === permissions.length}
                          name="select-all"
                          onChange={(isSelected: boolean) => {
                            field.handleChange(
                              isSelected ? permissions.map((p) => p.id) : [],
                            );
                          }}
                        >
                          <Checkbox.Content>
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <Label>Seleccionar todos los permisos</Label>
                          </Checkbox.Content>
                        </Checkbox>
                        <div className="ml-6 flex flex-col gap-2">
                          <CheckboxGroup
                            name="permissions"
                            value={[
                              ...new Set([
                                ...(field.state.value ?? []),
                                ...permissionsRoleSelected,
                              ]),
                            ].map(String)}
                            onChange={(value) => {
                              const fieldValue = value.map(Number);
                              /**
                               * Eliminar de los permisos seleccionados aquellos que ya están incluidos por el role seleccionado,
                               * para evitar confusiones al usuario sobre qué permisos ha seleccionado explícitamente y
                               * cuáles están heredados del role.
                               */
                              const permissionsRoleSelectedFiltered =
                                fieldValue.filter(
                                  (id) => !permissionsRoleSelected.includes(id),
                                );

                              console.log({
                                permissionsRoleSelectedFiltered,
                                fieldValue,
                              });

                              field.handleChange(
                                permissionsRoleSelectedFiltered,
                              );
                            }}
                          >
                            {permissions.map((permission) => {
                              const isSelectedPermission =
                                permissionsRoleSelected.includes(permission.id);
                              return (
                                <div
                                  className="block border-b px-0 py-3 mb-2"
                                  key={permission.id}
                                >
                                  <Checkbox
                                    key={permission.id}
                                    value={permission.id.toString()}
                                    isDisabled={isSelectedPermission}
                                    className="mt-0"
                                  >
                                    <Checkbox.Content>
                                      <Checkbox.Control>
                                        <Checkbox.Indicator />
                                      </Checkbox.Control>
                                      <Label className="mt-0">
                                        {permission.name}
                                      </Label>
                                    </Checkbox.Content>
                                    <Description>
                                      {permission.description}
                                    </Description>
                                  </Checkbox>
                                  {isSelectedPermission && (
                                    <p className="text-xs font-medium text-stone-700 mt-1">
                                      Permiso heredado del role:{" "}
                                      {roleSelected?.name}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </CheckboxGroup>
                        </div>
                      </div>
                    );
                  }}
                </form.Field>
              );
            }}
          </form.Subscribe>
        </Tabs.Panel>
      </Tabs>

      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          isSubmitting: state.isSubmitting,
          errorMap: state.errorMap,
        })}
        children={({ canSubmit, isSubmitting, errorMap }) => {
          const error = ((errorMap.onSubmit as any) || errorMap.onServer) as
            string | undefined;
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
                {isSubmitting ? "Guardando..." : "Guardar usuario"}
              </Button>
            </>
          );
        }}
      />
    </form>
  );
}
