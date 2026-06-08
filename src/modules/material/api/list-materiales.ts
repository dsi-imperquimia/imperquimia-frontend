import type { Material } from "../types/material";

const materiales: Material[] = [
  {
    id: 1,
    nombre: "Impermeabilizante acrílico",
    descripcion: "Producto para techos y superficies expuestas al agua",
    unidad: "cubeta",
    costoUnitario: "341.59",
    estado: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    nombre: "Malla poliéster",
    descripcion: "Refuerzo para impermeabilización",
    unidad: "metro",
    costoUnitario: "2.50",
    estado: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    nombre: "Sellador acrílico",
    descripcion: "Sellador para grietas y juntas",
    unidad: "galón",
    costoUnitario: "18.75",
    estado: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function listMateriales(): Promise<Material[]> {
  return materiales;
}