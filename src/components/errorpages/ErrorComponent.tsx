import { Button } from "@heroui/react/button";
import { Link, type ErrorComponentProps } from "@tanstack/react-router";
import { Home, Signpost } from "lucide-react";

export function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const message =
    typeof error === "object" && error !== null && "message" in error &&
    typeof error.message === "string" ? error.message : undefined;
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800 p-4">
      <h1 className="text-6xl font-bold text-red-600 mb-2 flex items-end gap-2">
        500
        <Signpost size={36} className="text-red-600" />
      </h1>
      <h2 className="text-2xl font-semibold mb-4">Ups, algo salió mal</h2>
      <p className="text-slate-500 mb-8 text-center max-w-md">
        Lo sentimos pero ha ocurrido un error inesperado. Por favor, intenta
        recargar la página o vuelve al inicio.
      </p>
      {message && (
        <p className="text-red-600 mb-4">
          <strong>Error:</strong> {message}
        </p>
      )}
      <div className="flex gap-4">
        {reset && (
          <Button onClick={reset} className="mb-4" variant="outline">
            Reintentar
          </Button>
        )}
        <Link to="/">
          <Button className="bg-red-600">
            Volver al Inicio
            <Home />
          </Button>
        </Link>
      </div>
    </div>
  );
}
