import { EmailInputField } from "@components/fields/EmailInputField";
import { InputField } from "@components/fields/InputField";
import { PasswordInputField } from "@components/fields/PasswordInputField";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { parseErrorApiUseForm } from "@modules/core/utils/parseErrorApi";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { User } from "lucide-react";
import { storeUser } from "../api/store-user";
import type { User as UserType } from "../types/user";

interface Props {
  user?: Partial<UserType>;
}

export function FormUser({ user: userInit }: Props) {
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
      navigate({ to: `/users/${user?.id}` });
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
              type="text"
              placeholder="Ingresa el apellido"
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
                {isSubmitting ? "Guardando..." : "Guardar usuario"}
              </Button>
            </>
          );
        }}
      />
    </form>
  );
}
