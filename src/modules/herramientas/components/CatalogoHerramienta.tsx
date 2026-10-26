import { ConfirmActionDialog } from "@components/ConfirmActionDialog";
import { InputField } from "@components/fields/InputField";
import { Button, Modal, Spinner } from "@heroui/react";
import { Table } from "@heroui/react/table";
import { toast } from "@heroui/react/toast";
import { userActions } from "@modules/auth/store/authStore";
import { cn } from "@modules/core/utils/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Edit2, Plus, RefreshCw } from "lucide-react";
import { useState, type FormEvent } from "react";

export interface CatalogoItem {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface CatalogoConfig {
  titulo: string;
  descripcion: string;
  singular: "marca" | "tipo";
  genero: "f" | "m";
  ejemplo: string;
  longitudMaxima: number;
  queryKey: string;
  listar: () => Promise<CatalogoItem[]>;
  crear: (nombre: string) => Promise<CatalogoItem>;
  actualizar: (id: number, nombre: string) => Promise<CatalogoItem>;
  cambiarEstado: (id: number, activo: boolean) => Promise<CatalogoItem>;
}

export function CatalogoHerramienta({ config }: { config: CatalogoConfig }) {
  const queryClient = useQueryClient();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [seleccionado, setSeleccionado] = useState<CatalogoItem | null>(null);
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [paraDesactivar, setParaDesactivar] = useState<CatalogoItem | null>(
    null,
  );
  const puedeCrear = userActions.hasPermission("HERRAMIENTA_CREATE");
  const puedeEditar = userActions.hasPermission("HERRAMIENTA_UPDATE");
  const nombreNormalizado = nombre.trim();
  const nombreValido =
    nombreNormalizado.length >= 4 &&
    nombreNormalizado.length <= config.longitudMaxima;
  const articulo = config.genero === "f" ? "la" : "el";
  const terminacion = config.genero === "f" ? "a" : "o";
  const nombreEntidad =
    config.singular === "marca"
      ? "Marca de herramienta"
      : "Tipo de herramienta";
  const {
    data: items = [],
    isPending,
    isError,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: [config.queryKey],
    queryFn: config.listar,
    retry: false,
  });

  function abrirNuevo() {
    setSeleccionado(null);
    setNombre("");
    setModalAbierto(true);
  }

  function abrirEdicion(item: CatalogoItem) {
    setSeleccionado(item);
    setNombre(item.nombre);
    setModalAbierto(true);
  }

  function cambiarModal(open: boolean) {
    if (guardando) return;
    setModalAbierto(open);
    if (!open) {
      setSeleccionado(null);
      setNombre("");
    }
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nombreValido || guardando) return;
    setGuardando(true);
    try {
      if (seleccionado)
        await config.actualizar(seleccionado.id, nombreNormalizado);
      else await config.crear(nombreNormalizado);
      toast.success(
        nombreEntidad +
          " " +
          (seleccionado ? "actualizad" : "cread") +
          terminacion +
          ".",
      );
      setModalAbierto(false);
      setSeleccionado(null);
      setNombre("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [config.queryKey] }),
        queryClient.invalidateQueries({ queryKey: ["herramientas"] }),
      ]);
    } catch {
      toast.danger(
        "No se pudo guardar " +
          articulo +
          " " +
          config.singular +
          ". Revisa si el nombre ya existe.",
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(item: CatalogoItem, activo: boolean) {
    if (procesandoId !== null) return false;
    setProcesandoId(item.id);
    try {
      await config.cambiarEstado(item.id, activo);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [config.queryKey] }),
        queryClient.invalidateQueries({ queryKey: ["herramientas"] }),
      ]);
      toast.success(
        (config.singular === "marca" ? "Marca" : "Tipo") +
          " " +
          (activo ? "activad" : "desactivad") +
          terminacion +
          ".",
      );
      return true;
    } catch {
      toast.danger(
        "No se pudo cambiar el estado de " +
          articulo +
          " " +
          config.singular +
          ".",
      );
      return false;
    } finally {
      setProcesandoId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/herramientas"
          className="text-sm text-blue-700 hover:underline"
        >
          Volver a herramientas
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {config.titulo}
            </h1>
            <p className="text-sm text-gray-500">{config.descripcion}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              isIconOnly
              aria-label={"Actualizar " + config.titulo.toLowerCase()}
              onClick={() => void refetch()}
              isDisabled={isPending || isRefetching}
            >
              <RefreshCw
                className={cn(isRefetching && "animate-spin")}
                size={16}
              />
            </Button>
            {puedeCrear && (
              <Button
                onClick={abrirNuevo}
                className="bg-gray-900 font-medium text-white"
              >
                <Plus size={16} className="mr-1" />
                {"Nuev" + terminacion + " " + config.singular}
              </Button>
            )}
          </div>
        </div>
      </div>

      {isError && (
        <p role="alert" className="text-red-600">
          No se pudo cargar el catálogo. Usa el botón de actualizar para
          reintentar.
        </p>
      )}
      {!isPending && !isError && items.length === 0 && (
        <p>
          {"Aún no hay " +
            (config.singular === "marca"
              ? "marcas registradas"
              : "tipos registrados") +
            "."}
        </p>
      )}
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label={config.titulo} className="min-w-full">
            <Table.Header>
              <Table.Column isRowHeader>Nombre</Table.Column>
              <Table.Column>Estado</Table.Column>
              <Table.Column className="w-64 text-right">Acciones</Table.Column>
            </Table.Header>
            <Table.Body>
              {isPending && (
                <Table.LoadMore isLoading>
                  <Table.LoadMoreContent>
                    <Spinner size="sm" />
                  </Table.LoadMoreContent>
                </Table.LoadMore>
              )}
              <Table.Collection items={isError ? [] : items}>
                {(item) => (
                  <Table.Row key={item.id}>
                    <Table.Cell className="font-semibold text-gray-800">
                      {item.nombre}
                    </Table.Cell>
                    <Table.Cell>
                      <span
                        className={cn(
                          "inline-flex w-20 justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                          item.activo
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-gray-300 bg-gray-100 text-gray-600",
                        )}
                      >
                        {item.activo
                          ? "Activ" + terminacion
                          : "Inactiv" + terminacion}
                      </span>
                    </Table.Cell>
                    <Table.Cell className="w-64">
                      {puedeEditar && (
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-24"
                            aria-label={"Editar " + item.nombre}
                            onClick={() => abrirEdicion(item)}
                          >
                            <Edit2 size={14} /> Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-28"
                            isPending={procesandoId === item.id}
                            isDisabled={procesandoId !== null}
                            onClick={() => {
                              if (item.activo) setParaDesactivar(item);
                              else void cambiarEstado(item, true);
                            }}
                          >
                            {item.activo ? "Desactivar" : "Activar"}
                          </Button>
                        </div>
                      )}
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Collection>
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      <Modal isOpen={modalAbierto} onOpenChange={cambiarModal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>
                  {seleccionado
                    ? "Editar " + config.singular
                    : "Nuev" + terminacion + " " + config.singular}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <form
                  id={"form-" + config.singular}
                  onSubmit={(event) => void guardar(event)}
                >
                  <InputField
                    label="Nombre"
                    isRequired
                    type="text"
                    placeholder={config.ejemplo}
                    value={nombre}
                    maxLength={config.longitudMaxima}
                    minLength={4}
                    onChange={(event) => setNombre(event.target.value)}
                    errorMessage={
                      nombre.length > 0 && !nombreValido
                        ? "El nombre debe tener entre 4 y " +
                          config.longitudMaxima +
                          " caracteres."
                        : undefined
                    }
                  />
                </form>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="ghost"
                  onClick={() => cambiarModal(false)}
                  isDisabled={guardando}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  form={"form-" + config.singular}
                  isPending={guardando}
                  isDisabled={guardando || !nombreValido}
                  className="bg-gray-900 text-white"
                >
                  {seleccionado
                    ? "Guardar cambios"
                    : "Crear " + config.singular}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <ConfirmActionDialog
        isOpen={paraDesactivar !== null}
        onOpenChange={(open) => {
          if (!open) setParaDesactivar(null);
        }}
        title={"Desactivar " + config.singular}
        description={
          "¿Desea desactivar " +
          articulo +
          " " +
          config.singular +
          ' "' +
          (paraDesactivar?.nombre ?? "") +
          '"? Permanecerá en las herramientas existentes.'
        }
        confirmLabel="Desactivar"
        onConfirm={() =>
          paraDesactivar
            ? cambiarEstado(paraDesactivar, false)
            : Promise.resolve(false)
        }
      />
    </div>
  );
}
