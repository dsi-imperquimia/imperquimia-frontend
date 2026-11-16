import { Chip } from "@heroui/react/chip";
import {
  ETIQUETA_ESTADO,
  ETIQUETA_PRIORIDAD,
  type EstadoIncidencia,
  type PrioridadIncidencia,
} from "../types/incidencia";

const COLOR_PRIORIDAD = {
  BAJA: "default",
  MEDIA: "accent",
  ALTA: "warning",
  CRITICA: "danger",
} as const satisfies Record<PrioridadIncidencia, string>;

const COLOR_ESTADO = {
  ABIERTA: "warning",
  EN_PROCESO: "accent",
  RESUELTA: "success",
} as const satisfies Record<EstadoIncidencia, string>;

export function InsigniaPrioridad({
  prioridad,
}: {
  prioridad: PrioridadIncidencia;
}) {
  return (
    <Chip size="sm" color={COLOR_PRIORIDAD[prioridad]}>
      {ETIQUETA_PRIORIDAD[prioridad]}
    </Chip>
  );
}

export function InsigniaEstado({ estado }: { estado: EstadoIncidencia }) {
  return (
    <Chip size="sm" color={COLOR_ESTADO[estado]}>
      {ETIQUETA_ESTADO[estado]}
    </Chip>
  );
}
