import type { Material } from "../types/material";

export const MAX_MATERIALES_REPORTE = 10;

export function getUnidadMaterial(material: Material) {
  return material.unidad ?? "unidad";
}

export function getEstadoMaterialLabel(estado: boolean) {
  return estado ? "Disponible" : "No disponible";
}

export function isMaterialDisponible(material: Material) {
  return material.estado === true;
}

export function sortMaterialesDisponiblesPrimero(materiales: Material[]) {
  return [...materiales].sort((first, second) => {
    if (isMaterialDisponible(first) !== isMaterialDisponible(second)) {
      return isMaterialDisponible(first) ? -1 : 1;
    }

    return first.nombre.localeCompare(second.nombre, "es");
  });
}

export function filtrarMateriales(materiales: Material[], busqueda: string) {
  const term = busqueda.trim().toLowerCase();
  const ordered = sortMaterialesDisponiblesPrimero(materiales);

  if (!term) return ordered;

  return ordered.filter((material) => {
    const searchable = [material.nombre, material.descripcion, material.codigo]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(term);
  });
}
