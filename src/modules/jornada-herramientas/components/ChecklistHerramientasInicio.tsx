import { TextAreaField } from "@components/fields/TextAreaField";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  confirmarInicioJornada,
  errorConfirmarVerificacion,
  errorJornadaHerramientas,
  verificarItemInicio,
} from "../api/jornada-herramientas";
import {
  ETIQUETA_ESTADO_VERIFICACION,
  type ErrorConfirmarVerificacion,
  type JornadaHerramientaItem,
  type JornadaHerramientas,
} from "../types/jornada-herramientas";

function InsigniaEstadoVerificacion({
  estado,
}: {
  estado: JornadaHerramientaItem["estadoInicio"];
}) {
  const clases: Record<string, string> = {
    PENDIENTE: "bg-gray-100 text-gray-700",
    VERIFICADA: "bg-green-100 text-green-800",
    AUSENTE: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${clases[estado]}`}
    >
      {ETIQUETA_ESTADO_VERIFICACION[estado]}
    </span>
  );
}

function FilaItemInicio({
  jornadaId,
  item,
  bloqueado,
  onVerificado,
}: {
  jornadaId: number;
  item: JornadaHerramientaItem;
  bloqueado: boolean;
  onVerificado: (jornada: JornadaHerramientas) => void;
}) {
  const [marcandoAusente, setMarcandoAusente] = useState(false);
  const [observacion, setObservacion] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function marcar(estado: "VERIFICADA" | "AUSENTE") {
    if (estado === "AUSENTE" && !marcandoAusente) {
      setMarcandoAusente(true);
      return;
    }
    if (estado === "AUSENTE" && !observacion.trim()) {
      setError("Indica una observación al marcar la herramienta como ausente.");
      return;
    }
    setIsPending(true);
    setError(null);
    try {
      const jornada = await verificarItemInicio(
        jornadaId,
        item.id,
        estado,
        observacion,
      );
      onVerificado(jornada);
      setMarcandoAusente(false);
      setObservacion("");
    } catch (e) {
      setError(errorJornadaHerramientas(e));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <li className="flex flex-col gap-2 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-medium text-gray-900">
            {item.herramienta.nombre}
          </span>{" "}
          <span className="text-gray-500">({item.herramienta.codigoUnico})</span>
        </div>
        <div className="flex items-center gap-2">
          <InsigniaEstadoVerificacion estado={item.estadoInicio} />
          {!bloqueado && item.estadoInicio === "PENDIENTE" && (
            <>
              <Button
                type="button"
                size="sm"
                isPending={isPending}
                isDisabled={isPending}
                onClick={() => void marcar("VERIFICADA")}
              >
                Verificar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                isDisabled={isPending}
                onClick={() => void marcar("AUSENTE")}
              >
                Marcar ausente
              </Button>
            </>
          )}
        </div>
      </div>
      {item.observacionInicio && (
        <p className="text-xs text-gray-500">
          Observación: {item.observacionInicio}
        </p>
      )}
      {marcandoAusente && !bloqueado && item.estadoInicio === "PENDIENTE" && (
        <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
          <TextAreaField
            placeholder="Describe por qué no está presente la herramienta"
            rows={2}
            maxLength={500}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            disabled={isPending}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              isPending={isPending}
              isDisabled={isPending}
              onClick={() => void marcar("AUSENTE")}
            >
              Confirmar ausencia
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              isDisabled={isPending}
              onClick={() => {
                setMarcandoAusente(false);
                setObservacion("");
                setError(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </li>
  );
}

export function ChecklistHerramientasInicio({
  jornada,
  onCambio,
}: {
  jornada: JornadaHerramientas;
  onCambio: (jornada: JornadaHerramientas) => void;
}) {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [errorPendientes, setErrorPendientes] =
    useState<ErrorConfirmarVerificacion | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const confirmada = jornada.verificacionInicioAt !== null;

  function onItemCambiado(actualizada: JornadaHerramientas) {
    setErrorPendientes(null);
    onCambio(actualizada);
  }

  async function confirmar() {
    setIsPending(true);
    setErrorPendientes(null);
    setErrorGeneral(null);
    try {
      const actualizada = await confirmarInicioJornada(jornada.id);
      onCambio(actualizada);
      await queryClient.invalidateQueries({ queryKey: ["jornada-herramientas"] });
    } catch (e) {
      const detalle = errorConfirmarVerificacion(e);
      if (detalle) {
        setErrorPendientes(detalle);
      } else {
        setErrorGeneral(errorJornadaHerramientas(e));
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>Verificación de inicio de jornada</Card.Title>
        <Card.Description>
          Herramientas despachadas a {jornada.empleado.nombreCompleto} en{" "}
          {jornada.proyecto.nombre} para el {jornada.fecha.slice(0, 10)}.
        </Card.Description>
      </Card.Header>
      <Card.Content className="gap-3">
        {confirmada && (
          <p role="status" className="text-sm text-green-800">
            Verificación de inicio confirmada.
          </p>
        )}
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {jornada.items.map((item) => (
            <FilaItemInicio
              key={item.id}
              jornadaId={jornada.id}
              item={item}
              bloqueado={confirmada}
              onVerificado={onItemCambiado}
            />
          ))}
        </ul>

        {errorPendientes && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-medium text-red-800">
              {errorPendientes.general}
            </p>
            <ul className="mt-1 list-inside list-disc text-sm text-red-700">
              {errorPendientes.herramientasPendientes.map((h) => (
                <li key={h.itemId}>
                  {h.nombre} ({h.codigoUnico})
                </li>
              ))}
            </ul>
          </div>
        )}
        {errorGeneral && (
          <p role="alert" className="text-sm text-red-700">
            {errorGeneral}
          </p>
        )}

        {!confirmada && (
          <div>
            <Button
              type="button"
              isPending={isPending}
              isDisabled={isPending}
              onClick={() => void confirmar()}
            >
              Confirmar verificación de inicio
            </Button>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
