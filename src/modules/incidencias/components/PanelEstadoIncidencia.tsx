import { InputField } from "@components/fields/InputField";
import { SelectedField } from "@components/fields/SelectedField";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { ListBox } from "@heroui/react/list-box";
import { fecha } from "@modules/proyectos/types/proyectos";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { cambiarEstadoIncidencia, errorIncidencia } from "../api/incidencias";
import {
  ESTADOS,
  ETIQUETA_ESTADO,
  type EstadoIncidencia,
  type HistorialIncidencia,
  type Incidencia,
} from "../types/incidencia";
import { InsigniaEstado } from "./InsigniasIncidencia";

function formatearFechaHora(valor: string) {
  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));
}

/** GPRCIMPER-141: cambio de estado con comentario e historial de cambios. */
export function PanelEstadoIncidencia({
  incidencia,
  puedeCambiar,
}: {
  incidencia: Incidencia;
  puedeCambiar: boolean;
}) {
  const queryClient = useQueryClient();
  const [nuevoEstado, setNuevoEstado] = useState<EstadoIncidencia | null>(null);
  const [comentario, setComentario] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const opciones = ESTADOS.filter((e) => e !== incidencia.estado);
  const historial: HistorialIncidencia[] = incidencia.historial ?? [];

  async function cambiar() {
    if (!nuevoEstado) return;
    setIsPending(true);
    setError(null);
    try {
      await cambiarEstadoIncidencia(incidencia.id, nuevoEstado, comentario);
      setNuevoEstado(null);
      setComentario("");
      await queryClient.invalidateQueries({ queryKey: ["incidencias"] });
    } catch (e) {
      setError(errorIncidencia(e).general ?? "No se pudo cambiar el estado.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-3">
          Estado
          <InsigniaEstado estado={incidencia.estado} />
        </Card.Title>
      </Card.Header>
      <Card.Content className="gap-4">
        {puedeCambiar && (
          <div className="grid items-end gap-3 sm:grid-cols-[14rem_1fr_auto]">
            <SelectedField
              label="Nuevo estado"
              placeholder="Selecciona…"
              selectedKey={nuevoEstado}
              isDisabled={isPending}
              onSelectionChange={(key) =>
                setNuevoEstado(key ? (String(key) as EstadoIncidencia) : null)
              }
            >
              {opciones.map((e) => (
                <ListBox.Item key={e} id={e} textValue={ETIQUETA_ESTADO[e]}>
                  {ETIQUETA_ESTADO[e]}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </SelectedField>
            <InputField
              label="Comentario (opcional)"
              maxLength={500}
              value={comentario}
              disabled={isPending}
              onChange={(e) => setComentario(e.target.value)}
            />
            <Button
              type="button"
              isPending={isPending}
              isDisabled={isPending || !nuevoEstado}
              onClick={() => void cambiar()}
            >
              Cambiar estado
            </Button>
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Historial de cambios
          </h3>
          {historial.length === 0 ? (
            <p className="text-sm text-gray-500">
              Sin movimientos registrados.
            </p>
          ) : (
            <ol className="space-y-2" aria-label="Historial de estados">
              {historial.map((h) => (
                <li
                  key={h.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {h.estadoAnterior ? (
                      <>
                        <InsigniaEstado estado={h.estadoAnterior} />
                        <span aria-hidden>→</span>
                      </>
                    ) : (
                      <span className="text-gray-500">Creada como</span>
                    )}
                    <InsigniaEstado estado={h.estadoNuevo} />
                    <span className="text-gray-500">
                      {formatearFechaHora(h.createdAt)}
                      {h.usuario &&
                        ` · ${h.usuario.name} ${h.usuario.lastName}`}
                    </span>
                  </div>
                  {h.comentario && (
                    <p className="mt-1 text-gray-700">{h.comentario}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Registrada el {fecha(incidencia.createdAt)}.
          </p>
        </div>
      </Card.Content>
    </Card>
  );
}
