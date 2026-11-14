import { InputField } from "@components/fields/InputField";
import { SelectedField } from "@components/fields/SelectedField";
import { Spinner } from "@heroui/react";
import { Button } from "@heroui/react/button";
import { ListBox } from "@heroui/react/list-box";
import { Table } from "@heroui/react/table";
import { toast } from "@heroui/react/toast";
import {
  listExistenciasMateriales,
  listMovimientosMateriales,
} from "@modules/materiales/api/inventario-materiales";
import { listMateriales } from "@modules/materiales/api/list-materiales";
import {
  MOTIVO_LABEL,
  type ExistenciaMaterial,
  type MovimientoMaterial,
} from "@modules/materiales/types/inventario-material";
import { listProyectos } from "@modules/proyectos/api/listProyectos";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRightLeft,
  Boxes,
  Building2,
  RefreshCw,
  Warehouse,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/materiales/inventario")({
  component: InventarioMateriales,
});

function formatCantidad(value: string | number, unidad: string) {
  return `${new Intl.NumberFormat("es-SV", { maximumFractionDigits: 2 }).format(Number(value))} ${unidad}`;
}

function formatFecha(value: string) {
  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/El_Salvador",
  }).format(new Date(value));
}

function InventarioMateriales() {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [proyectoId, setProyectoId] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const existencias = useQuery({
    queryKey: ["inventario-materiales", "existencias"],
    queryFn: listExistenciasMateriales,
  });
  const movimientos = useQuery({
    queryKey: [
      "inventario-materiales",
      "movimientos",
      { materialId, proyectoId, desde, hasta },
    ],
    queryFn: () =>
      listMovimientosMateriales({ materialId, proyectoId, desde, hasta }),
  });
  const materiales = useQuery({
    queryKey: ["materiales"],
    queryFn: listMateriales,
  });
  const proyectos = useQuery({
    queryKey: ["proyectos"],
    queryFn: listProyectos,
  });

  const error =
    existencias.error ||
    movimientos.error ||
    materiales.error ||
    proyectos.error;
  useEffect(() => {
    if (error) toast.danger("No se pudo cargar el inventario de materiales.");
  }, [error]);

  const saldos = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase();
    return (existencias.data ?? []).filter((item) =>
      `${item.material.codigo ?? ""} ${item.material.nombre} ${item.ubicacion.nombre}`
        .toLocaleLowerCase()
        .includes(texto),
    );
  }, [busqueda, existencias.data]);

  const totalBodega = saldos.filter(
    (item) => item.ubicacion.tipo === "BODEGA" && Number(item.cantidad) > 0,
  ).length;
  const totalProyectos = new Set(
    saldos
      .filter(
        (item) =>
          item.ubicacion.tipo === "PROYECTO" && Number(item.cantidad) > 0,
      )
      .map((item) => item.ubicacion.proyectoId),
  ).size;

  async function refreshAll() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["inventario-materiales"] }),
      queryClient.invalidateQueries({ queryKey: ["materiales"] }),
    ]);
  }

  const isRefreshing = existencias.isFetching || movimientos.isFetching;
  const isLoading = existencias.isPending || movimientos.isPending;
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Inventario de materiales
          </h1>
          <p className="text-sm text-gray-500">
            Consulta saldos por ubicación y el historial de movimientos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            isIconOnly
            aria-label="Actualizar inventario"
            onClick={refreshAll}
            isDisabled={isRefreshing}
            isPending={isRefreshing}
          >
            <RefreshCw className={isRefreshing ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={Boxes}
          label="Saldos registrados"
          value={String(saldos.length)}
        />
        <SummaryCard
          icon={Warehouse}
          label="Materiales en bodega"
          value={String(totalBodega)}
        />
        <SummaryCard
          icon={Building2}
          label="Proyectos con existencias"
          value={String(totalProyectos)}
        />
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Existencias actuales
            </h2>
            <p className="text-sm text-gray-500">
              Cada saldo corresponde a un material y una ubicación física.
            </p>
          </div>
          <InputField
            label="Buscar existencia"
            placeholder="Material, código o ubicación"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            className="w-full sm:max-w-sm"
          />
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <Table>
            <Table.ScrollContainer>
              <Table.Content
                aria-label="Existencias de materiales"
                className="min-w-full"
              >
                <Table.Header>
                  <Table.Column isRowHeader>Material</Table.Column>
                  <Table.Column>Ubicación</Table.Column>
                  <Table.Column>Tipo</Table.Column>
                  <Table.Column>Cantidad</Table.Column>
                </Table.Header>
                <Table.Body>
                  {existencias.isPending && (
                    <Table.LoadMore isLoading>
                      <Table.LoadMoreContent>
                        <Spinner size="sm" />
                      </Table.LoadMoreContent>
                    </Table.LoadMore>
                  )}
                  <Table.Collection items={saldos}>
                    {(item: ExistenciaMaterial) => (
                      <Table.Row key={item.id}>
                        <Table.Cell>
                          <div className="font-medium text-gray-900">
                            {item.material.nombre}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.material.codigo || `#${item.material.id}`}
                          </div>
                        </Table.Cell>
                        <Table.Cell>{item.ubicacion.nombre}</Table.Cell>
                        <Table.Cell>
                          <span
                            className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
                              item.ubicacion.tipo === "BODEGA"
                                ? "bg-sky-50 text-sky-700"
                                : "bg-violet-50 text-violet-700"
                            }`}
                          >
                            {item.ubicacion.tipo === "BODEGA"
                              ? "Bodega"
                              : "Proyecto"}
                          </span>
                        </Table.Cell>
                        <Table.Cell className="font-semibold">
                          {formatCantidad(item.cantidad, item.material.unidad)}
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Collection>
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
          {!existencias.isPending && saldos.length === 0 && (
            <p className="p-8 text-center text-sm text-gray-500">
              {busqueda
                ? "No hay existencias que coincidan con la búsqueda."
                : "Todavía no hay existencias registradas."}
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Historial de movimientos
          </h2>
          <p className="text-sm text-gray-500">
            Entradas, salidas y traslados, con fecha y usuario responsable.
          </p>
        </div>
        <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <SelectedField
            label="Material"
            placeholder="Todos los materiales"
            selectedKey={materialId || null}
            onSelectionChange={(key) => setMaterialId(String(key ?? ""))}
          >
            <ListBox.Item id="" textValue="Todos los materiales">
              Todos los materiales
            </ListBox.Item>
            {(materiales.data ?? []).map((material) => (
              <ListBox.Item
                key={material.id}
                id={String(material.id)}
                textValue={material.nombre}
              >
                {material.nombre}
              </ListBox.Item>
            ))}
          </SelectedField>
          <SelectedField
            label="Proyecto"
            placeholder="Todos los proyectos"
            selectedKey={proyectoId || null}
            onSelectionChange={(key) => setProyectoId(String(key ?? ""))}
          >
            <ListBox.Item id="" textValue="Todos los proyectos">
              Todos los proyectos
            </ListBox.Item>
            {(proyectos.data ?? []).map((proyecto) => (
              <ListBox.Item
                key={proyecto.id}
                id={String(proyecto.id)}
                textValue={proyecto.nombre}
              >
                {proyecto.nombre}
              </ListBox.Item>
            ))}
          </SelectedField>
          <InputField
            label="Desde"
            type="date"
            value={desde}
            onChange={(event) => setDesde(event.target.value)}
          />
          <InputField
            label="Hasta"
            type="date"
            value={hasta}
            onChange={(event) => setHasta(event.target.value)}
          />
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <Table>
            <Table.ScrollContainer>
              <Table.Content
                aria-label="Movimientos de materiales"
                className="min-w-full"
              >
                <Table.Header>
                  <Table.Column isRowHeader>Fecha</Table.Column>
                  <Table.Column>Material</Table.Column>
                  <Table.Column>Movimiento</Table.Column>
                  <Table.Column>Origen</Table.Column>
                  <Table.Column>Destino</Table.Column>
                  <Table.Column>Cantidad</Table.Column>
                  <Table.Column>Responsable</Table.Column>
                </Table.Header>
                <Table.Body>
                  {movimientos.isPending && (
                    <Table.LoadMore isLoading>
                      <Table.LoadMoreContent>
                        <Spinner size="sm" />
                      </Table.LoadMoreContent>
                    </Table.LoadMore>
                  )}
                  <Table.Collection items={movimientos.data ?? []}>
                    {(item: MovimientoMaterial) => (
                      <Table.Row key={item.id}>
                        <Table.Cell>
                          {formatFecha(item.fechaMovimiento)}
                        </Table.Cell>
                        <Table.Cell>
                          <span className="font-medium">
                            {item.material.nombre}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex items-center gap-2">
                            <ArrowRightLeft className="size-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium">
                                {MOTIVO_LABEL[item.motivo]}
                              </div>
                              {item.observacion && (
                                <div className="max-w-56 truncate text-xs text-gray-500">
                                  {item.observacion}
                                </div>
                              )}
                            </div>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          {item.origen?.nombre ?? "Externo"}
                        </Table.Cell>
                        <Table.Cell>
                          {item.destino?.nombre ?? "Externo"}
                        </Table.Cell>
                        <Table.Cell className="font-semibold">
                          {formatCantidad(item.cantidad, item.material.unidad)}
                        </Table.Cell>
                        <Table.Cell>
                          {item.usuario.name} {item.usuario.lastName}
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Collection>
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
          {!movimientos.isPending && (movimientos.data?.length ?? 0) === 0 && (
            <p className="p-8 text-center text-sm text-gray-500">
              No hay movimientos para los filtros seleccionados.
            </p>
          )}
        </div>
      </section>

      {error && !isLoading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudo obtener toda la información. Revisa tu conexión y vuelve a
          actualizar.
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Boxes;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
