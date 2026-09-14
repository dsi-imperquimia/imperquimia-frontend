import { FieldError } from "@heroui/react/field-error";
import { Label } from "@heroui/react/label";
import { TextArea, type TextAreaProps } from "@heroui/react/textarea";
import { TextField } from "@heroui/react/textfield";
import type { ReactNode } from "react";
import { useId } from "react";

export interface TextAreaFieldProps extends TextAreaProps {
  label?: string;
  errorMessage?: ReactNode;
  isRequired?: boolean;
}

export function TextAreaField({
  label,
  errorMessage,
  isRequired,
  variant = "secondary",
  fullWidth = true,
  id,
  ...textAreaProps
}: TextAreaFieldProps) {
  const generatedId = useId();
  const textAreaId = id ?? generatedId;

  return (
    <TextField
      className="flex flex-col gap-1"
      isInvalid={!!errorMessage}
      isRequired={isRequired}
      validationBehavior="aria" // solo marca visual (*); la validación la maneja el formulario
    >
      {label && <Label htmlFor={textAreaId}>{label}</Label>}
      <TextArea
        id={textAreaId}
        variant={variant}
        fullWidth={fullWidth}
        {...textAreaProps}
      />
      {errorMessage && <FieldError>{errorMessage}</FieldError>}
    </TextField>
  );
}
