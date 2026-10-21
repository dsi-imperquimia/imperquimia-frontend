import { FieldError } from "@heroui/react/field-error";
import {
  InputGroup,
  type InputGroupInputProps,
  type InputGroupVariants,
} from "@heroui/react/input-group";
import { Label } from "@heroui/react/label";
import { TextField } from "@heroui/react/textfield";
import type { ReactNode } from "react";
import { useId } from "react";

export interface InputFieldProps extends InputGroupInputProps {
  label?: string;
  startContent?: ReactNode;
  endContent?: ReactNode;
  errorMessage?: ReactNode;
  groupVariant?: InputGroupVariants["variant"];
  isRequired?: boolean;
}

export function InputField({
  label,
  startContent,
  endContent,
  errorMessage,
  groupVariant = "secondary",
  isRequired,
  id,
  ...inputProps
}: InputFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <TextField
      className="flex flex-col gap-1"
      isInvalid={!!errorMessage}
      isRequired={isRequired}
      validationBehavior="aria" // solo marca visual (*); la validación la maneja el formulario
    >
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <InputGroup variant={groupVariant}>
        {startContent && <InputGroup.Prefix>{startContent}</InputGroup.Prefix>}
        <InputGroup.Input id={inputId} {...inputProps} />
        {endContent && (
          <InputGroup.Suffix className="pr-0">{endContent}</InputGroup.Suffix>
        )}
      </InputGroup>
      {errorMessage && <FieldError>{errorMessage}</FieldError>}
    </TextField>
  );
}
