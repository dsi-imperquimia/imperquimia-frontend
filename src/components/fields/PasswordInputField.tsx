import { Button } from "@heroui/react/button";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";
import { InputField, type InputFieldProps } from "./InputField";

interface PasswordInputFieldProps extends InputFieldProps {}

export function PasswordInputField(props: PasswordInputFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <InputField
      label="Contraseña"
      type={isVisible ? "text" : "password"}
      placeholder="Ingresa la contraseña"
      startContent={<KeyRound className="size-4 text-muted" />}
      endContent={
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          onPress={() => setIsVisible(!isVisible)}
        >
          {isVisible ? (
            <Eye className="size-4" />
          ) : (
            <EyeOff className="size-4" />
          )}
        </Button>
      }
      {...props}
    />
  );
}
