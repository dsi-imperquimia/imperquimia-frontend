import { AtSign } from "lucide-react";
import { InputField, type InputFieldProps } from "./InputField";

interface EmailInputFieldProps extends InputFieldProps {}

export function EmailInputField(props: EmailInputFieldProps) {
  return (
    <InputField
      label="Correo electrónico"
      type="email"
      placeholder="Ingresa el correo"
      startContent={<AtSign className="size-4 text-muted" />}
      {...props}
    />
  );
}
