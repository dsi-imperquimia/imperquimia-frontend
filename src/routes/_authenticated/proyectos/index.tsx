import { Button } from "@heroui/react/button";
import { ListBox } from "@heroui/react/list-box";
import { Table } from "@heroui/react/table";
import { InputField } from "@components/fields/InputField";
import { SelectedField } from "@components/fields/SelectedField";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { userActions } from "@modules/auth/store/authStore";
import { cn } from "@modules/core/utils/utils";
import { listProyectos } from "@modules/proyectos/api/listProyectos";
import { dinero, fecha } from "@modules/proyectos/types/proyectos";
import { Eye, Plus, RefreshCw } from "lucide-react";

const ESTADO_LABEL: Record<string, string> = {
  GARANTIA: "GARANTÍA",
  EN_PAUSA: "EN PAUSA",
};

export const Route = createFileRoute("/_authenticated/proyectos/")({
  component: Proyectos,
});
function Proyectos() {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("ACTIVO");
  const {
    data = [],
    isPending,
    isError,
    refetch,
    isRefetching,
  } = useQuery({ queryKey: ["proyectos"], queryFn: listProyectos });
  const items = data.filter(
    (p) =>
      (!estado || p.estado === estado) &&
      `${p.nombre} ${p.cliente ?? ""} ${p.ubicacion ?? ""}`
        .toLocaleLowerCase()
        .includes(busqueda.trim().toLocaleLowerCase()),
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Proyectos</h1>
          <p className="text-sm text-gray-500">
            Obras, materiales cotizados y herramientas asignadas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            isIconOnly
            aria-label="Actualizar proyectos"
            onClick={() => refetch()}
            isDisabled={isPending || isRefetching}
            isPending={isRefetching}
          >
            <RefreshCw className={cn(isRefetching && "animate-spin")} />
          </Button>
          {userActions.hasPermission("PROYECTO_CREATE") && (
            <Link to="/proyectos/create">
              <Button>
                <Plus className="mr-1 size-4" />
                Crear proyecto
              </Button>
            </Link>
          )}
        </div>
      </div>
      <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <InputField
          label="Buscar proyecto"
          type="search"
          placeholder="Nombre, cliente o ubicación"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
        />
        <SelectedField
          label="Estado"
          selectedKey={estado || "TODOS"}
          onSelectionChange={(key) =>
            setEstado(key === "TODOS" ? "" : String(key ?? ""))
          }
        >
          <ListBox.Item id="TODOS">Todos</ListBox.Item>
          {[
            "ACTIVO",
            "EN_PAUSA",
            "FINALIZADO",
            "PAGADO",
            "GARANTIA",
            "CANCELADO",
          ].map((item) => (
            <ListBox.Item key={item} id={item} textValue={item}>
              {ESTADO_LABEL[item] ?? item}
            </ListBox.Item>
          ))}
        </SelectedField>
      </div>
      {isPending ? (
        <p role="status">Cargando proyectos…</p>
      ) : isError ? (
        <div role="alert">
          No se pudieron cargar los proyectos.{" "}
          <Button variant="outline" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          {data.length
            ? "No hay proyectos que coincidan con los filtros."
            : "Todavía no hay proyectos registrados."}
        </p>
      ) : (
        <Table>
          <Table.ScrollContainer>
            <Table.Content
              aria-label="Listado de proyectos"
              className="min-w-full"
            >
              <Table.Header>
                <Table.Column isRowHeader>Proyecto</Table.Column>
                <Table.Column>Cliente</Table.Column>
                <Table.Column>Fechas</Table.Column>
                <Table.Column>Estado</Table.Column>
                <Table.Column>Total cotizado</Table.Column>
                <Table.Column>Acciones</Table.Column>
              </Table.Header>
              <Table.Body>
                <Table.Collection items={items}>
                  {(p) => (
                    <Table.Row key={p.id}>
                      <Table.Cell>
                        <p className="font-semibold">{p.nombre}</p>
                        <p className="text-gray-500">
                          {p.ubicacion || "Sin ubicación"}
                        </p>
                      </Table.Cell>
                      <Table.Cell>{p.cliente || "Sin definir"}</Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap">
                          {fecha(p.fechaInicio)}
                        </span>
                        <span className="block whitespace-nowrap text-gray-500">
                          {fecha(p.fechaFin)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="inline-flex whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                          {ESTADO_LABEL[p.estado] ?? p.estado}
                        </span>
                      </Table.Cell>
                      <Table.Cell>{dinero(p.total)}</Table.Cell>
                      <Table.Cell>
                        <Link
                          to="/proyectos/$proyectoId"
                          params={{ proyectoId: String(p.id) }}
                        >
                          <Button size="sm">
                            <Eye className="mr-1 size-4" />
                            Ver proyecto
                          </Button>
                        </Link>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Collection>
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      )}
    </div>
  );
}
