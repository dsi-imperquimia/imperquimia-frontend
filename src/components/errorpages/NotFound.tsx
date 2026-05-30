import { Button } from "@heroui/react/button";
import { Link } from "@tanstack/react-router";
import { FiHome } from "react-icons/fi";
import { GrPaint } from "react-icons/gr";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800 p-4">
      <h1 className="text-6xl font-bold text-red-600 mb-2 flex items-end gap-2">
        404
        <GrPaint size={36} className="text-red-600" />
      </h1>
      <h2 className="text-2xl font-semibold mb-4">Página no encontrada</h2>
      <p className="text-slate-500 mb-8 text-center max-w-md">
        Lo sentimos la pagina a la que intentas acceder no existe o no tienes
        permisos para verla.
      </p>
      <Link to="/">
        <Button className="bg-red-600">
          Volver al Inicio
          <FiHome />
        </Button>
      </Link>
    </div>
  );
}
