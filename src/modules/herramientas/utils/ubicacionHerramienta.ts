import type { Herramienta } from "../types/herramientas";

export function getUbicacionHerramientaLabel(
  herramienta: Pick<Herramienta, "ubicacionActual" | "proyecto">,
) {
  if (herramienta.ubicacionActual === "PROYECTO") {
    return herramienta.proyecto?.nombre ?? "Proyecto asignado";
  }

  const etiquetas = {
    BODEGA: "Bodega General",
    TALLER: "Taller",
    DESECHO: "Desecho",
  } as const;

  return etiquetas[herramienta.ubicacionActual];
}
