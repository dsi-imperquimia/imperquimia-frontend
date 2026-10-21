import { DUI_MASK, formatDui } from "@modules/core/utils/masks";
import { IdCard } from "lucide-react";
import { InputField, type InputFieldProps } from "./InputField";

interface DuiInputFieldProps extends InputFieldProps {}

export function DuiInputField({ onChange, ...props }: DuiInputFieldProps) {
  return (
    <InputField
      label="DUI"
      type="text"
      inputMode="numeric"
      placeholder={DUI_MASK}
      maxLength={DUI_MASK.length}
      startContent={<IdCard className="size-4 text-muted" />}
      onChange={(e) => {
        e.target.value = formatDui(e.target.value);
        onChange?.(e);
      }}
      {...props}
    />
  );
}
