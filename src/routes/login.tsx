import logo from "@/assets/iq_isologo_1.png";
import { Card } from "@heroui/react/card";
import { LoginForm } from "@modules/auth/components/LoginForm";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-sm p-8 gap-10">
        <Card.Header className="flex flex-col items-center gap-3">
          <img src={logo} alt="Imperquimia" className="h-14" />
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900">Bienvenido</h1>
            <p className="mt-1 text-sm text-gray-500">
              Ingresa tus credenciales para continuar
            </p>
          </div>
        </Card.Header>
        <Card.Content>
          <LoginForm />
        </Card.Content>
      </Card>
    </div>
  );
}
