import { DatePickerField } from "@components/fields/DatePickerField";
import { SelectedField } from "@components/fields/SelectedField";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { ListBox } from "@heroui/react/list-box";
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
import { getProyecto } from "@modules/proyectos/api/getProyecto";
import { isAxiosError } from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/jornada-herramientas/")({
  component: JornadaHerramientasPage,
});

function nuevaClaveOperacion(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return "00000000-0000-4000-8000-000000000000";
}

function JornadaHerramientasPage() {
  const queryClient = useQueryClient();
  const [proyectoId, setProyectoId] = useState("");
  const [empleadoId, setEmpleadoId] = useState("");
  const [fecha, setFecha] = useState(fechaHoyIso());
  const [jornada, setJornada] = useState<JornadaHerramientas | null>(null);
  const [abriendo, setAbriendo] = useState(false);
  const [errorAbrir, setErrorAbrir] = useState<string | null>(null);

  const proyectosQuery = useQuery({
    queryKey: ["jornada-herramientas", "proyectos-disponibles"],
    queryFn: listProyectosDisponiblesJornada,
  });

  const proyectoQuery = useQuery({
    queryKey: ["proyectos", "detalle", proyectoId],
    queryFn: () => getProyecto(Number(proyectoId)),
    enabled: !!proyectoId,
  });

  const tecnicos = (proyectoQuery.data?.empleados ?? []).filter(
    (asignacion) => !asignacion.fechaRetiro,
  );

  const jornadaQuery = useQuery({
    queryKey: ["jornada-herramientas", "detalle", proyectoId, empleadoId, fecha],
    queryFn: () =>
      getJornadaHerramientas(Number(proyectoId), Number(empleadoId), fecha),
    enabled: !!proyectoId && !!empleadoId && !!fecha,
    retry: false,
  });

  const jornadaActual = jornada ?? jornadaQuery.data ?? null;
  const noHayChecklist =
    jornadaQuery.isError &&
    isAxiosError(jornadaQuery.error) &&
    jornadaQuery.error.response?.status === 404;

  async function abrir() {
    setAbriendo(true);
    setErrorAbrir(null);
    try {
      const { jornada: creada } = await abrirJornadaHerramientas({
        claveOperacion: nuevaClaveOperacion(),
        proyectoId: Number(proyectoId),
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
        <Card.Content className="grid gap-4 sm:grid-cols-3">
          <SelectedField
            label="Proyecto"
            placeholder="Selecciona un proyecto"
            selectedKey={proyectoId || null}
            onSelectionChange={(key) => {
              setProyectoId(String(key ?? ""));
              setEmpleadoId("");
              setJornada(null);
            }}
          >
            {(proyectosQuery.data ?? []).map((p) => (
              <ListBox.Item key={p.id} id={String(p.id)} textValue={p.nombre}>
                {p.nombre}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </SelectedField>

          <SelectedField
            label="Técnico"
            placeholder="Selecciona un técnico"
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

      {!!proyectoId && !!empleadoId && !!fecha && (
        <>
          {jornadaQuery.isLoading && (
            <p role="status" className="text-sm text-gray-500">
              Buscando checklist…
            </p>
          )}

          {noHayChecklist && !jornadaActual && (
            <Card>
              <Card.Content className="gap-3">
                <p className="text-sm text-gray-600">
                  Todavía no se ha abierto el checklist de herramientas para
                  este técnico en esta fecha.
                </p>
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
            <>
              <ChecklistHerramientasInicio
                jornada={jornadaActual}
                onCambio={setJornada}
              />
              <ChecklistHerramientasRetorno
                jornada={jornadaActual}
                onCambio={setJornada}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
