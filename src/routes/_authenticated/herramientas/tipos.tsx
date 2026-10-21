import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { userActions } from "@modules/auth/store/authStore";
import {
  createTipoHerramienta,
  listTiposHerramienta,
  setTipoHerramientaActivo,
  updateTipoHerramienta,
} from "@modules/herramientas/api/tiposHerramienta";

export const Route = createFileRoute("/_authenticated/herramientas/tipos")({
  component: TiposHerramientaPage,
});

function TiposHerramientaPage() {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const puedeCrear = userActions.hasPermission("HERRAMIENTA_CREATE");
  const puedeEditar = userActions.hasPermission("HERRAMIENTA_UPDATE");
  const nombreValido = nombre.trim().length >= 4;
  const {
    data: tipos = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: ["tipos-herramienta"],
    queryFn: () => listTiposHerramienta(),
  });

  async function guardar(event: FormEvent) {
    event.preventDefault();
    if (!nombreValido) return;
    setGuardando(true);
    try {
      if (editandoId === null) {
        await createTipoHerramienta(nombre.trim());
        toast.success("Tipo de herramienta creado.");
      } else {
        await updateTipoHerramienta(editandoId, nombre.trim());
        toast.success("Tipo de herramienta actualizado.");
      }
      setNombre("");
      setEditandoId(null);
      await queryClient.invalidateQueries({ queryKey: ["tipos-herramienta"] });
      await queryClient.invalidateQueries({ queryKey: ["herramientas"] });
    } catch {
      toast.danger(
        "No se pudo guardar el tipo. Revisa si el nombre ya existe.",
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(id: number, activo: boolean) {
    setProcesandoId(id);
    try {
      await setTipoHerramientaActivo(id, activo);
      await queryClient.invalidateQueries({ queryKey: ["tipos-herramienta"] });
      toast.success(activo ? "Tipo activado." : "Tipo desactivado.");
    } catch {
      toast.danger("No se pudo cambiar el estado del tipo.");
    } finally {
      setProcesandoId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          to="/herramientas"
          className="text-sm text-blue-700 hover:underline"
        >
          Volver a herramientas
        </Link>
        <h1 className="mt-3 text-2xl font-bold">Tipos de herramienta</h1>
        <p className="text-sm text-gray-600">
          Los tipos desactivados permanecen en las herramientas existentes, pero
          no se pueden elegir para nuevas altas.
        </p>
      </div>

      {(puedeCrear || puedeEditar) && (editandoId !== null || puedeCrear) && (
        <form
          onSubmit={guardar}
          className="flex flex-wrap items-end gap-3 rounded-xl border p-4"
        >
          <label className="flex min-w-64 flex-1 flex-col gap-1 text-sm">
            <span>{editandoId === null ? "Nuevo tipo" : "Editar tipo"}</span>
            <input
              className="min-h-10 rounded-lg border border-gray-300 px-3"
              maxLength={80}
              minLength={4}
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ej. Eléctrica"
              required
            />
            <span className="text-xs text-gray-500">Mínimo 4 caracteres.</span>
          </label>
          <Button
            type="submit"
            isPending={guardando}
            isDisabled={guardando || !nombreValido}
          >
            {editandoId === null ? "Crear tipo" : "Guardar cambios"}
          </Button>
          {editandoId !== null && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditandoId(null);
                setNombre("");
              }}
            >
              Cancelar
            </Button>
          )}
        </form>
      )}

      {isPending && <p>Cargando tipos...</p>}
      {isError && (
        <p className="text-red-600">No se pudo cargar el catálogo.</p>
      )}
      {!isPending && !isError && tipos.length === 0 && (
        <p>Aún no hay tipos registrados.</p>
      )}
      <ul className="divide-y rounded-xl border">
        {tipos.map((tipo) => (
          <li
            key={tipo.id}
            className="flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div>
              <span className="font-medium">{tipo.nombre}</span>
              <span className="ml-3 text-sm text-gray-500">
                {tipo.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
            {puedeEditar && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditandoId(tipo.id);
                    setNombre(tipo.nombre);
                  }}
                >
                  Editar
                </Button>
                <Button
                  variant="outline"
                  isPending={procesandoId === tipo.id}
                  isDisabled={procesandoId !== null}
                  onClick={() => void cambiarEstado(tipo.id, !tipo.activo)}
                >
                  {tipo.activo ? "Desactivar" : "Activar"}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
