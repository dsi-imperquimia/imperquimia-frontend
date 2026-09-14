import { DUI_MASK, formatNit, NIT_MASK } from "@modules/core/utils/masks";
import { FileDigit } from "lucide-react";
import { InputField, type InputFieldProps } from "./InputField";

interface NitInputFieldProps extends InputFieldProps {}

export function NitInputField({ onChange, ...props }: NitInputFieldProps) {
  return (
    <InputField
      label="NIT"
      type="text"
      inputMode="numeric"
      placeholder={`${DUI_MASK} ó ${NIT_MASK}`}
      maxLength={NIT_MASK.length}
      startContent={<FileDigit className="size-4 text-muted" />}
      onChange={(e) => {
        e.target.value = formatNit(e.target.value);
        onChange?.(e);
      }}
      {...props}
    />
  );
}
