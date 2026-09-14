import { Description } from "@heroui/react/description";
import { FieldError } from "@heroui/react/field-error";
import { Label } from "@heroui/react/label";
import { ListBox } from "@heroui/react/list-box";
import { Select, type SelectProps } from "@heroui/react/select";
import type { ReactNode } from "react";

interface SelectedFieldProps<T extends object> extends SelectProps<
  T,
  "single"
> {
  label?: string;
  description?: ReactNode;
  errorMessage?: ReactNode;
}

export function SelectedField({
  label,
  description,
  children,
  errorMessage,
  ...rest
}: SelectedFieldProps<any>) {
  return (
    <Select
      placeholder="Selecciona un cargo"
      variant="secondary"
      validationBehavior="aria" // solo marca visual (*); la validación la maneja el formulario
      isInvalid={!!errorMessage} // FieldError solo se muestra si el campo es inválido
      {...rest}
    >
      {label && <Label>{label}</Label>}
      <Select.Trigger className="w-full">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      {description && <Description>{description}</Description>}
      <Select.Popover>
        <ListBox>{children}</ListBox>
      </Select.Popover>
      {errorMessage && <FieldError>{errorMessage}</FieldError>}
    </Select>
  );
}
