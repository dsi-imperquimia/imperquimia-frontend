import { SelectedField } from "@components/fields/SelectedField";
import { Card } from "@heroui/react/card";
import { Spinner } from "@heroui/react";
import { Button } from "@heroui/react/button";
import { ListBox } from "@heroui/react/list-box";
import { Table } from "@heroui/react/table";
import { listProyectosDisponiblesActividad } from "@modules/actividades-diarias/api/actividades-diarias";
import { useAuth } from "@modules/auth/store/authStore";
import { listIncidencias } from "@modules/incidencias/api/incidencias";
import { BotonEliminarIncidencia } from "@modules/incidencias/components/BotonEliminarIncidencia";
import {
  InsigniaEstado,
  InsigniaPrioridad,
} from "@modules/incidencias/components/InsigniasIncidencia";
import {
  ESTADOS,
  ETIQUETA_ESTADO,
  ETIQUETA_PRIORIDAD,
  PRIORIDADES,
  type EstadoIncidencia,
  type Incidencia,
  type PrioridadIncidencia,
} from "@modules/incidencias/types/incidencia";
import { fecha } from "@modules/proyectos/types/proyectos";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/incidencias/")({
  component: IncidenciasPage,
});

function IncidenciasPage() {
  const { hasPermission } = useAuth();
  const puedeEliminar = hasPermission("INCIDENCIA_DELETE");
  const [proyectoId, setProyectoId] = useState("");
  const [estado, setEstado] = useState<EstadoIncidencia | "">("");
  const [prioridad, setPrioridad] = useState<PrioridadIncidencia | "">("");

  const proyectosQuery = useQuery({
    queryKey: ["actividades-diarias", "proyectos-disponibles"],
    queryFn: listProyectosDisponiblesActividad,
  });
  const filtros = {
    proyectoId: proyectoId ? Number(proyectoId) : null,
    estado,
    prioridad,
  };
  const query = useQuery({
    queryKey: ["incidencias", "lista", filtros],
    queryFn: () => listIncidencias(filtros),
  });
  const incidencias = query.data ?? [];
  const hayFiltros = Boolean(proyectoId || estado || prioridad);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Incidencias en obra</h1>
          <p className="text-sm text-gray-500">
            Registra incidencias, asígnales prioridad y dales seguimiento por
            estado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            isDisabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Actualizar
          </Button>
          {hasPermission("INCIDENCIA_CREATE") && (
            <Link to="/incidencias/create">
              <Button>Registrar incidencia</Button>
            </Link>
          )}
        </div>
      </div>

      <Card className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SelectedField
          label="Proyecto"
          placeholder="Todos los proyectos"
          selectedKey={proyectoId || null}
          onSelectionChange={(key) => setProyectoId(String(key ?? ""))}
        >
          <ListBox.Item id="" textValue="Todos los proyectos">
            Todos los proyectos
          </ListBox.Item>
          {(proyectosQuery.data ?? []).map((p) => (
            <ListBox.Item key={p.id} id={String(p.id)} textValue={p.nombre}>
              {p.nombre}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </SelectedField>
        <SelectedField
          label="Estado"
          placeholder="Todos los estados"
          selectedKey={estado || null}
          onSelectionChange={(key) =>
            setEstado(String(key ?? "") as EstadoIncidencia | "")
          }
        >
          <ListBox.Item id="" textValue="Todos los estados">
            Todos los estados
          </ListBox.Item>
          {ESTADOS.map((e) => (
            <ListBox.Item key={e} id={e} textValue={ETIQUETA_ESTADO[e]}>
              {ETIQUETA_ESTADO[e]}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </SelectedField>
        <SelectedField
          label="Prioridad"
          placeholder="Todas las prioridades"
          selectedKey={prioridad || null}
          onSelectionChange={(key) =>
            setPrioridad(String(key ?? "") as PrioridadIncidencia | "")
          }
        >
          <ListBox.Item id="" textValue="Todas las prioridades">
            Todas las prioridades
          </ListBox.Item>
          {PRIORIDADES.map((p) => (
            <ListBox.Item key={p} id={p} textValue={ETIQUETA_PRIORIDAD[p]}>
              {ETIQUETA_PRIORIDAD[p]}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </SelectedField>
        {hayFiltros && (
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setProyectoId("");
                setEstado("");
                setPrioridad("");
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        )}
      </Card>

      {query.isError && (
        <div role="alert">
          No se pudieron cargar las incidencias.{" "}
          <Button variant="outline" onClick={() => void query.refetch()}>
            Reintentar
          </Button>
        </div>
      )}
      {query.isSuccess && incidencias.length === 0 && (
        <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          {hayFiltros
            ? "No hay incidencias que coincidan con los filtros."
            : "Todavía no hay incidencias registradas."}
        </p>
      )}
      {(query.isPending || incidencias.length > 0) && (
        <Table>
          <Table.ScrollContainer>
            <Table.Content
              aria-label="Listado de incidencias"
              className="min-w-full"
            >
              <Table.Header>
                <Table.Column isRowHeader>Incidencia</Table.Column>
                <Table.Column>Fecha</Table.Column>
                <Table.Column>Proyecto</Table.Column>
                <Table.Column>Prioridad</Table.Column>
                <Table.Column>Estado</Table.Column>
                <Table.Column>Reporte de jornada</Table.Column>
                <Table.Column>Acciones</Table.Column>
              </Table.Header>
              <Table.Body>
                {query.isPending && (
                  <Table.LoadMore isLoading>
                    <Table.LoadMoreContent>
                      <Spinner size="sm" />
                    </Table.LoadMoreContent>
                  </Table.LoadMore>
                )}
                <Table.Collection items={incidencias}>
                  {(i: Incidencia) => (
                    <Table.Row key={i.id}>
                      <Table.Cell className="font-medium text-gray-900">
                        {i.titulo}
                      </Table.Cell>
                      <Table.Cell>{fecha(i.fecha)}</Table.Cell>
                      <Table.Cell>
                        {i.proyecto?.nombre ?? `Proyecto #${i.proyectoId}`}
                      </Table.Cell>
                      <Table.Cell>
                        <InsigniaPrioridad prioridad={i.prioridad} />
                      </Table.Cell>
                      <Table.Cell>
                        <InsigniaEstado estado={i.estado} />
                      </Table.Cell>
                      <Table.Cell>
                        {i.actividadDiaria ? (
                          <Link
                            to="/actividades-diarias/editar/$actividadId"
                            params={{
                              actividadId: String(i.actividadDiaria.id),
                            }}
                            className="text-blue-700 underline"
                          >
                            {i.actividadDiaria.nombre}
                          </Link>
                        ) : (
                          <span className="text-gray-500">Sin vincular</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-2">
                          <Link
                            to="/incidencias/$incidenciaId"
                            params={{ incidenciaId: String(i.id) }}
                          >
                            <Button type="button" variant="outline" size="sm">
                              Ver detalle
                            </Button>
                          </Link>
                          {puedeEliminar && (
                            <BotonEliminarIncidencia
                              incidencia={i}
                              size="sm"
                              volverAlListado={false}
                            />
                          )}
                        </div>
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
