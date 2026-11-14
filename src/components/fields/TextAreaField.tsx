import { FieldError } from "@heroui/react/field-error";
import { Label } from "@heroui/react/label";
import { TextArea, type TextAreaProps } from "@heroui/react/textarea";
import { TextField } from "@heroui/react/textfield";
import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";

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
  value,
  rows = 2,
  maxLength,
  style,
  ...textAreaProps
}: TextAreaFieldProps) {
  const generatedId = useId();
  const textAreaId = id ?? generatedId;
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Autosize: el textarea crece con el contenido en vez de mostrar scroll interno.
  useEffect(() => {
    const el = textAreaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <TextField
      className="flex flex-col gap-1"
      isInvalid={!!errorMessage}
      isRequired={isRequired}
      validationBehavior="aria" // solo marca visual (*); la validación la maneja el formulario
    >
      {label && <Label htmlFor={textAreaId}>{label}</Label>}
      <TextArea
        ref={textAreaRef}
        id={textAreaId}
        variant={variant}
        fullWidth={fullWidth}
        rows={rows}
        value={value}
        maxLength={maxLength}
        style={{ overflow: "hidden", resize: "none", ...style }}
        {...textAreaProps}
      />
      {maxLength !== undefined && (
        <span className="self-end text-xs text-gray-400">
          {String(value ?? "").length}/{maxLength}
        </span>
      )}
      {errorMessage && <FieldError>{errorMessage}</FieldError>}
    </TextField>
  );
}
