import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { userActions } from "@modules/auth/store/authStore";
import {
  createMarcaHerramienta,
  listMarcasHerramienta,
  setMarcaHerramientaActiva,
  updateMarcaHerramienta,
} from "@modules/herramientas/api/marcasHerramienta";

export const Route = createFileRoute("/_authenticated/herramientas/marcas")({
  component: MarcasHerramientaPage,
});

function MarcasHerramientaPage() {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const puedeCrear = userActions.hasPermission("HERRAMIENTA_CREATE");
  const puedeEditar = userActions.hasPermission("HERRAMIENTA_UPDATE");
  const nombreValido = nombre.trim().length >= 4;
  const {
    data: marcas = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["marcas-herramienta"],
    queryFn: () => listMarcasHerramienta(),
  });

  async function guardar(event: FormEvent) {
    event.preventDefault();
    if (!nombreValido) return;
    setGuardando(true);
    try {
      if (editandoId === null) {
        await createMarcaHerramienta(nombre.trim());
        toast.success("Marca de herramienta creada.");
      } else {
        await updateMarcaHerramienta(editandoId, nombre.trim());
        toast.success("Marca de herramienta actualizada.");
      }
      setNombre("");
      setEditandoId(null);
      await queryClient.invalidateQueries({ queryKey: ["marcas-herramienta"] });
      await queryClient.invalidateQueries({ queryKey: ["herramientas"] });
    } catch {
      toast.danger(
        "No se pudo guardar la marca. Revisa si el nombre ya existe.",
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(id: number, activa: boolean) {
    setProcesandoId(id);
    try {
      await setMarcaHerramientaActiva(id, activa);
      await queryClient.invalidateQueries({ queryKey: ["marcas-herramienta"] });
      toast.success(activa ? "Marca activada." : "Marca desactivada.");
    } catch {
      toast.danger("No se pudo cambiar el estado de la marca.");
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
        <h1 className="mt-3 text-2xl font-bold">Marcas de herramientas</h1>
        <p className="text-sm text-gray-600">
          Las marcas desactivadas permanecen en las herramientas existentes,
          pero no se pueden elegir para nuevas altas.
        </p>
      </div>

      {(puedeCrear || puedeEditar) && (editandoId !== null || puedeCrear) && (
        <form
          onSubmit={guardar}
          className="flex flex-wrap items-end gap-3 rounded-xl border p-4"
        >
          <label className="flex min-w-64 flex-1 flex-col gap-1 text-sm">
            <span>{editandoId === null ? "Nueva marca" : "Editar marca"}</span>
            <input
              className="min-h-10 rounded-lg border border-gray-300 px-3"
              maxLength={100}
              minLength={4}
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ej. Bosch"
              required
            />
            <span className="text-xs text-gray-500">Mínimo 4 caracteres.</span>
          </label>
          <Button
            type="submit"
            isPending={guardando}
            isDisabled={guardando || !nombreValido}
          >
            {editandoId === null ? "Crear marca" : "Guardar cambios"}
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

      {isPending && <p>Cargando marcas...</p>}
      {isError && (
        <div className="space-y-2">
          <p className="text-red-600">No se pudo cargar el catálogo.</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void refetch()}
          >
            Reintentar
          </Button>
        </div>
      )}
      {!isPending && !isError && marcas.length === 0 && (
        <p>Aún no hay marcas registradas.</p>
      )}
      {!isError && (
        <ul className="divide-y rounded-xl border">
          {marcas.map((marca) => (
            <li
              key={marca.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <span className="font-medium">{marca.nombre}</span>
                <span className="ml-3 text-sm text-gray-500">
                  {marca.activo ? "Activa" : "Inactiva"}
                </span>
              </div>
              {puedeEditar && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditandoId(marca.id);
                      setNombre(marca.nombre);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    isPending={procesandoId === marca.id}
                    isDisabled={procesandoId !== null}
                    onClick={() => void cambiarEstado(marca.id, !marca.activo)}
                  >
                    {marca.activo ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
