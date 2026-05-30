import { Button } from "@heroui/react/button";
import { InputGroup } from "@heroui/react/input-group";
import { Label } from "@heroui/react/label";
import { TextField } from "@heroui/react/textfield";
import { loginRequest } from "@modules/auth/api/authApi";
import { authActions } from "@modules/auth/store/authStore";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LuEye, LuEyeOff } from "react-icons/lu";
import { MdAlternateEmail, MdKey } from "react-icons/md";

export function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isVisiblePassword, setIsVisiblePassword] = useState(false);

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user, access_token } = await loginRequest(email, password);
      authActions.login(user, access_token);
      await navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex w-80 flex-col gap-4">
        <TextField className="flex flex-col gap-1">
          <Label htmlFor="email">Correo electrónico</Label>
          <InputGroup variant="secondary">
            <InputGroup.Prefix>
              <MdAlternateEmail className="size-4 text-muted" />
            </InputGroup.Prefix>
            <InputGroup.Input
              id="email"
              placeholder="Ingresa tu email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </InputGroup>
        </TextField>
        <TextField className="flex flex-col gap-1">
          <Label htmlFor="password">Contraseña</Label>
          <InputGroup variant="secondary">
            <InputGroup.Prefix>
              <MdKey className="size-4 text-muted" />
            </InputGroup.Prefix>
            <InputGroup.Input
              id="password"
              placeholder="Ingresa tu contraseña"
              type={isVisiblePassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <InputGroup.Suffix className="pr-0">
              <Button
                isIconOnly
                aria-label={
                  isVisiblePassword ? "Hide password" : "Show password"
                }
                size="sm"
                variant="ghost"
                onPress={() => setIsVisiblePassword(!isVisiblePassword)}
              >
                {isVisiblePassword ? (
                  <LuEye className="size-4" />
                ) : (
                  <LuEyeOff className="size-4" />
                )}
              </Button>
            </InputGroup.Suffix>
          </InputGroup>
        </TextField>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <Button
        type="submit"
        fullWidth
        isDisabled={loading}
        isPending={loading}
        className="bg-gray-900"
      >
        {loading ? "Iniciando sesión..." : "Iniciar sesión"}
      </Button>
    </form>
  );
}
