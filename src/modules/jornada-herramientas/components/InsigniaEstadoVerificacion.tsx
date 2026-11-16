import { Chip } from "@heroui/react/chip";
import { Check, CircleDashed, X } from "lucide-react";
import {
  ETIQUETA_ESTADO_VERIFICACION,
  type EstadoVerificacionHerramienta,
} from "../types/jornada-herramientas";

const COLOR: Record<EstadoVerificacionHerramienta, "default" | "success" | "danger"> = {
  PENDIENTE: "default",
  VERIFICADA: "success",
  AUSENTE: "danger",
};

const ICONO: Record<EstadoVerificacionHerramienta, React.ElementType> = {
  PENDIENTE: CircleDashed,
  VERIFICADA: Check,
  AUSENTE: X,
};

export function InsigniaEstadoVerificacion({
  estado,
}: {
  estado: EstadoVerificacionHerramienta;
}) {
  const Icono = ICONO[estado];
  return (
    <Chip size="sm" color={COLOR[estado]}>
      <Icono className="size-3" />
      <Chip.Label>{ETIQUETA_ESTADO_VERIFICACION[estado]}</Chip.Label>
    </Chip>
  );
}
