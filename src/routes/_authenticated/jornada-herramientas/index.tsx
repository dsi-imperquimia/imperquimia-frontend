import { DatePickerField } from "@components/fields/DatePickerField";
import { SelectedField } from "@components/fields/SelectedField";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Chip } from "@heroui/react/chip";
import { ListBox } from "@heroui/react/list-box";
import { Tabs } from "@heroui/react/tabs";
import { SelectorProyectoActividad } from "@modules/actividades-diarias/components/SelectorProyectoActividad";
import {
  abrirJornadaHerramientas,
  errorJornadaHerramientas,
  getJornadaHerramientas,
  listProyectosDisponiblesJornada,
} from "@modules/jornada-herramientas/api/jornada-herramientas";
import { ChecklistHerramientasInicio } from "@modules/jornada-herramientas/components/ChecklistHerramientasInicio";
import { ChecklistHerramientasRetorno } from "@modules/jornada-herramientas/components/ChecklistHerramientasRetorno";
import {
  fechaHoyIso,
  type JornadaHerramientas,
} from "@modules/jornada-herramientas/types/jornada-herramientas";
import { nuevaClaveOperacion } from "@lib/uuid";
import { getProyecto } from "@modules/proyectos/api/getProyecto";
import { isAxiosError } from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/jornada-herramientas/")({
  component: JornadaHerramientasPage,
});

function JornadaHerramientasPage() {
  const queryClient = useQueryClient();
  const [proyectoId, setProyectoId] = useState<number | null>(null);
  const [empleadoId, setEmpleadoId] = useState("");
  const [fecha, setFecha] = useState(fechaHoyIso());
  const [jornada, setJornada] = useState<JornadaHerramientas | null>(null);
  const [abriendo, setAbriendo] = useState(false);
  const [errorAbrir, setErrorAbrir] = useState<string | null>(null);
  const [tab, setTab] = useState<"inicio" | "retorno">("inicio");

  const proyectosQuery = useQuery({
    queryKey: ["jornada-herramientas", "proyectos-disponibles"],
    queryFn: listProyectosDisponiblesJornada,
  });

  const proyectoQuery = useQuery({
    queryKey: ["proyectos", "detalle", proyectoId],
    queryFn: () => getProyecto(proyectoId!),
    enabled: proyectoId !== null,
  });

  const tecnicos = (proyectoQuery.data?.empleados ?? []).filter(
    (asignacion) => !asignacion.fechaRetiro,
  );

  // Paso 2: si el proyecto tiene un solo técnico asignado, lo preselecciona.
  useEffect(() => {
    if (tecnicos.length === 1 && !empleadoId) {
      setEmpleadoId(String(tecnicos[0].empleadoId));
    }
  }, [tecnicos, empleadoId]);

  const jornadaQuery = useQuery({
    queryKey: ["jornada-herramientas", "detalle", proyectoId, empleadoId, fecha],
    queryFn: () => getJornadaHerramientas(proyectoId!, Number(empleadoId), fecha),
    enabled: proyectoId !== null && !!empleadoId && !!fecha,
    retry: false,
  });

  const jornadaActual = jornada ?? jornadaQuery.data ?? null;
  const noHayChecklist =
    jornadaQuery.isError &&
    isAxiosError(jornadaQuery.error) &&
    jornadaQuery.error.response?.status === 404;

  // Al cargar o actualizar una jornada, muestra la pestaña que corresponde
  // al paso en el que realmente está (si ya confirmó el inicio, salta a retorno).
  useEffect(() => {
    if (!jornadaActual) return;
    setTab(jornadaActual.verificacionInicioAt ? "retorno" : "inicio");
  }, [jornadaActual?.id, jornadaActual?.verificacionInicioAt]);

  async function abrir() {
    setAbriendo(true);
    setErrorAbrir(null);
    try {
      const { jornada: creada } = await abrirJornadaHerramientas({
        claveOperacion: nuevaClaveOperacion(),
        proyectoId: proyectoId!,
        empleadoId: Number(empleadoId),
        fecha,
      });
      setJornada(creada);
      await queryClient.invalidateQueries({ queryKey: ["jornada-herramientas"] });
    } catch (e) {
      setErrorAbrir(errorJornadaHerramientas(e));
    } finally {
      setAbriendo(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Verificación de herramientas</h1>
        <p className="text-sm text-gray-500">
          Verifica el inventario de herramientas despachadas al técnico al
          inicio de la jornada y confirma su retorno al finalizarla.
        </p>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Paso 1 · Elige proyecto, técnico y fecha</Card.Title>
        </Card.Header>
        <Card.Content className="grid gap-4 sm:grid-cols-3">
          <SelectorProyectoActividad
            proyectos={proyectosQuery.data ?? []}
            selectedProyectoId={proyectoId}
            onSelectProyecto={(id) => {
              setProyectoId(id);
              setEmpleadoId("");
              setJornada(null);
            }}
          />

          <SelectedField
            label="Técnico"
            placeholder={
              proyectoId ? "Selecciona un técnico" : "Elige primero un proyecto"
            }
            selectedKey={empleadoId || null}
            isDisabled={!proyectoId}
            onSelectionChange={(key) => {
              setEmpleadoId(String(key ?? ""));
              setJornada(null);
            }}
          >
            {tecnicos.map((asignacion) => (
              <ListBox.Item
                key={asignacion.empleadoId}
                id={String(asignacion.empleadoId)}
                textValue={asignacion.empleado.nombreCompleto}
              >
                {asignacion.empleado.nombreCompleto}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </SelectedField>

          <DatePickerField
            label="Fecha"
            value={fecha}
            onChange={(valor) => {
              setFecha(valor);
              setJornada(null);
            }}
            max={fechaHoyIso()}
          />
        </Card.Content>
      </Card>

      {proyectoId !== null && !!empleadoId && !!fecha && (
        <>
          {jornadaQuery.isLoading && (
            <p role="status" className="text-sm text-gray-500">
              Buscando checklist…
            </p>
          )}

          {noHayChecklist && !jornadaActual && (
            <Card>
              <Card.Header>
                <Card.Title>Paso 2 · Importa el checklist de herramientas</Card.Title>
                <Card.Description>
                  Todavía no se ha abierto el checklist de herramientas para
                  este técnico en esta fecha. Al importarlo se copian todas
                  las herramientas que bodega tiene despachadas a este
                  proyecto.
                </Card.Description>
              </Card.Header>
              <Card.Content className="gap-3">
                <div>
                  <Button
                    type="button"
                    isPending={abriendo}
                    isDisabled={abriendo}
                    onClick={() => void abrir()}
                  >
                    Importar herramientas despachadas
                  </Button>
                </div>
                {errorAbrir && (
                  <p role="alert" className="text-sm text-red-700">
                    {errorAbrir}
                  </p>
                )}
              </Card.Content>
            </Card>
          )}

          {jornadaQuery.isError && !noHayChecklist && (
            <p role="alert" className="text-sm text-red-700">
              No se pudo cargar el checklist de herramientas.
            </p>
          )}

          {jornadaActual && (
            <Tabs
              selectedKey={tab}
              onSelectionChange={(key) => setTab(key as "inicio" | "retorno")}
            >
              <Tabs.ListContainer>
                <Tabs.List aria-label="Fases de la jornada">
                  <Tabs.Tab id="inicio">
                    Paso 3 · Verificación de inicio
                    {jornadaActual.verificacionInicioAt ? (
                      <Chip size="sm" color="success">
                        Confirmada
                      </Chip>
                    ) : (
                      <Chip size="sm" color="warning">
                        Pendiente
                      </Chip>
                    )}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="retorno">
                    Paso 4 · Conciliación de retorno
                    {!jornadaActual.verificacionInicioAt ? (
                      <Chip size="sm" color="default">
                        <Lock className="size-3" />
                        Bloqueado
                      </Chip>
                    ) : jornadaActual.verificacionRetornoAt ? (
                      <Chip size="sm" color="success">
                        Confirmado
                      </Chip>
                    ) : (
                      <Chip size="sm" color="warning">
                        Pendiente
                      </Chip>
                    )}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>
              <Tabs.Panel id="inicio" className="pt-4">
                <ChecklistHerramientasInicio
                  jornada={jornadaActual}
                  onCambio={setJornada}
                />
              </Tabs.Panel>
              <Tabs.Panel id="retorno" className="pt-4">
                <ChecklistHerramientasRetorno
                  jornada={jornadaActual}
                  onCambio={setJornada}
                />
              </Tabs.Panel>
            </Tabs>
          )}
        </>
      )}
    </div>
  );
}
