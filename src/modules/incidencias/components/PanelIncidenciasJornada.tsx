import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Checkbox } from "@heroui/react/checkbox";
import { Label } from "@heroui/react/label";
import { Modal } from "@heroui/react/modal";
import { fecha } from "@modules/proyectos/types/proyectos";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  errorIncidencia,
  listIncidencias,
  vincularIncidenciasAJornada,
} from "../api/incidencias";
import { FormIncidencia } from "./FormIncidencia";
import { InsigniaEstado, InsigniaPrioridad } from "./InsigniasIncidencia";

/**
 * GPRCIMPER-142 (vista desde el reporte): lista las incidencias del proyecto
 * que están libres o ya vinculadas a esta jornada y permite elegir cuáles
 * quedan vinculadas.
 */
export function PanelIncidenciasJornada({
  actividadId,
  proyectoId,
  proyectoNombre,
  fechaJornada,
  puedeEditar,
  puedeCrear = false,
}: {
  actividadId: number;
  proyectoId: number;
  proyectoNombre?: string;
  /** Fecha de la jornada; es la fecha inicial de las incidencias nuevas. */
  fechaJornada: string;
  puedeEditar: boolean;
  puedeCrear?: boolean;
}) {
  const [creando, setCreando] = useState(false);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["incidencias", "lista", { proyectoId }],
    queryFn: () => listIncidencias({ proyectoId }),
  });

  const disponibles = useMemo(
    () =>
      (query.data ?? []).filter(
        (i) =>
          i.actividadDiariaId === null || i.actividadDiariaId === actividadId,
      ),
    [query.data, actividadId],
  );
  const vinculadasServidor = useMemo(
    () =>
      disponibles
        .filter((i) => i.actividadDiariaId === actividadId)
        .map((i) => i.id),
    [disponibles, actividadId],
  );

  const [seleccion, setSeleccion] = useState<number[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );

  useEffect(() => {
    setSeleccion(vinculadasServidor);
  }, [vinculadasServidor]);

  const hayCambios =
    seleccion.length !== vinculadasServidor.length ||
    seleccion.some((id) => !vinculadasServidor.includes(id));

  function alternar(id: number, marcada: boolean) {
    setMensaje(null);
    setSeleccion((prev) =>
      marcada
        ? prev.includes(id)
          ? prev
          : [...prev, id]
        : prev.filter((x) => x !== id),
    );
  }

  async function guardar() {
    setIsPending(true);
    setMensaje(null);
    try {
      await vincularIncidenciasAJornada(actividadId, seleccion);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["incidencias"] }),
        queryClient.invalidateQueries({ queryKey: ["actividades-diarias"] }),
      ]);
      setMensaje({ ok: true, texto: "Incidencias vinculadas actualizadas." });
    } catch (e) {
      setMensaje({
        ok: false,
        texto: errorIncidencia(e).general ?? "No se pudo guardar el vínculo.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>Incidencias de la jornada</Card.Title>
        <Card.Description>
          Registra las incidencias ocurridas en esta jornada o vincula las
          existentes del proyecto.
        </Card.Description>
      </Card.Header>
      <Card.Content className="gap-3">
        {puedeCrear && (
          <div>
            <Button type="button" onClick={() => setCreando(true)}>
              Nueva incidencia
            </Button>
          </div>
        )}
        {query.isPending && <p role="status">Cargando incidencias…</p>}
        {query.isError && (
          <p role="alert" className="text-sm text-red-700">
            No se pudieron cargar las incidencias del proyecto.{" "}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void query.refetch()}
            >
              Reintentar
            </Button>
          </p>
        )}

        {query.isSuccess && disponibles.length === 0 && (
          <p className="text-sm text-gray-500">
            No hay incidencias disponibles para vincular en este proyecto.
          </p>
        )}

        {disponibles.length > 0 && (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {disponibles.map((i) => (
              <li key={i.id} className="flex items-center gap-3 p-3 text-sm">
                <Checkbox
                  isSelected={seleccion.includes(i.id)}
                  isDisabled={!puedeEditar || isPending}
                  onChange={(marcada: boolean) => alternar(i.id, marcada)}
                  className="flex-1"
                >
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Label className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {i.titulo}
                      </span>
                      <InsigniaPrioridad prioridad={i.prioridad} />
                      <InsigniaEstado estado={i.estado} />
                      <span className="font-normal text-gray-500">
                        {fecha(i.fecha)}
                      </span>
                    </Label>
                  </Checkbox.Content>
                </Checkbox>
                <Link
                  to="/incidencias/$incidenciaId"
                  params={{ incidenciaId: String(i.id) }}
                  className="text-blue-700 underline"
                >
                  Ver
                </Link>
              </li>
            ))}
          </ul>
        )}

        {puedeEditar && disponibles.length > 0 && (
          <div>
            <Button
              type="button"
              isPending={isPending}
              isDisabled={isPending || !hayCambios}
              onClick={() => void guardar()}
            >
              Guardar vínculos
            </Button>
          </div>
        )}
        {mensaje && (
          <p
            role={mensaje.ok ? "status" : "alert"}
            className={`text-sm ${mensaje.ok ? "text-green-800" : "text-red-700"}`}
          >
            {mensaje.texto}
          </p>
        )}
      </Card.Content>

      <Modal isOpen={creando} onOpenChange={setCreando}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-h-[calc(100vh-2rem)] w-full overflow-hidden sm:max-w-2xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Nueva incidencia de la jornada</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="min-h-0 overflow-y-auto">
                <FormIncidencia
                  embebido
                  jornada={{
                    id: actividadId,
                    proyectoId,
                    proyectoNombre,
                    fecha: fechaJornada,
                  }}
                  onSuccess={() => {
                    setCreando(false);
                    setMensaje({
                      ok: true,
                      texto: "Incidencia registrada y vinculada a la jornada.",
                    });
                  }}
                  onCancel={() => setCreando(false)}
                />
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Card>
  );
}
