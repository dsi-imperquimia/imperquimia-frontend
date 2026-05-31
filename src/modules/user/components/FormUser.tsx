import { Button } from "@heroui/react/button";
import { FieldError } from "@heroui/react/field-error";
import { InputGroup } from "@heroui/react/input-group";
import { Label } from "@heroui/react/label";
import { TextField } from "@heroui/react/textfield";
import { toast } from "@heroui/react/toast";
import { parseErrorApiUseForm } from "@modules/core/parseErrorApi";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { AtSign, Eye, EyeOff, KeyRound, User } from "lucide-react";
import { useState } from "react";
import { storeUser } from "../api/store-user";
import type { User as UserType } from "../types/user";

interface Props {
  user?: Partial<UserType>;
}

export function FormUser({ user: userInit }: Props) {
  const navigate = useNavigate();
  const [isVisiblePassword, setIsVisiblePassword] = useState(false);

  const form = useForm({
    defaultValues: userInit ?? {
      name: "Leonel",
      lastName: "Henríquez",
      email: "hf18014@ues.edu.sv",
      password: "12345678",
    },
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
            <TextField
              className="flex flex-col gap-1"
              isInvalid={!field.state.meta.isValid}
            >
              <Label htmlFor={field.name}>Nombre</Label>
              <InputGroup variant="secondary">
                <InputGroup.Prefix>
                  <User className="size-4 text-muted" />
                </InputGroup.Prefix>
                <InputGroup.Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  type="text"
                  placeholder="Ingresa el nombre"
                />
              </InputGroup>
              {!field.state.meta.isValid && (
                <FieldError>{field.state.meta.errors.join(", ")}</FieldError>
              )}
            </TextField>
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
            <TextField
              className="flex flex-col gap-1"
              isInvalid={!field.state.meta.isValid}
            >
              <Label htmlFor={field.name}>Apellido</Label>
              <InputGroup variant="secondary">
                <InputGroup.Prefix>
                  <User className="size-4 text-muted" />
                </InputGroup.Prefix>
                <InputGroup.Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  type="text"
                  placeholder="Ingresa el apellido"
                />
              </InputGroup>
              {!field.state.meta.isValid && (
                <FieldError>{field.state.meta.errors.join(", ")}</FieldError>
              )}
            </TextField>
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
            <TextField
              className="flex flex-col gap-1"
              isInvalid={!field.state.meta.isValid}
            >
              <Label htmlFor={field.name}>Correo electrónico</Label>
              <InputGroup variant="secondary">
                <InputGroup.Prefix>
                  <AtSign className="size-4 text-muted" />
                </InputGroup.Prefix>
                <InputGroup.Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  type="email"
                  placeholder="Ingresa el correo"
                />
              </InputGroup>
              {!field.state.meta.isValid && (
                <FieldError>{field.state.meta.errors.join(", ")}</FieldError>
              )}
            </TextField>
          )}
        </form.Field>

        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) => {
              if (!value) return "La contraseña es requerida";
              if (value.length < 8) return "Mínimo 8 caracteres";
              return undefined;
            },
          }}
        >
          {(field) => (
            <TextField
              className="flex flex-col gap-1"
              isInvalid={!field.state.meta.isValid}
            >
              <Label htmlFor={field.name}>Contraseña</Label>
              <InputGroup variant="secondary">
                <InputGroup.Prefix>
                  <KeyRound className="size-4 text-muted" />
                </InputGroup.Prefix>
                <InputGroup.Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  type={isVisiblePassword ? "text" : "password"}
                  placeholder="Ingresa la contraseña"
                />
                <InputGroup.Suffix className="pr-0">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    onPress={() => setIsVisiblePassword(!isVisiblePassword)}
                  >
                    {isVisiblePassword ? (
                      <Eye className="size-4" />
                    ) : (
                      <EyeOff className="size-4" />
                    )}
                  </Button>
                </InputGroup.Suffix>
              </InputGroup>
              {!field.state.meta.isValid && (
                <FieldError>{field.state.meta.errors.join(", ")}</FieldError>
              )}
            </TextField>
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
