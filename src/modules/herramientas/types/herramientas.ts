import type { Proyecto } from "@/modules/proyectos/types/proyectos";

export enum EstadoHerramienta {
  DISPONIBLE = "DISPONIBLE",
  EN_PROYECTO = "EN_PROYECTO",
  MANTENIMIENTO = "MANTENIMIENTO",
  DANADA = "DANADA",
  REQUIERE_REVISION = "REQUIERE_REVISION",
  DESECHO = "DESECHO",
}

export interface ReporteDefectoHerramienta {
  id: number;
  herramientaId: number;
  proyectoId: number | null;
  observacion: string;
  estado: "REQUIERE_REVISION" | "REVISADO" | "CERRADO";
  createdAt: string;
  reportadoPor: { id: number; name: string; lastName: string };
  proyecto: { id: number; nombre: string } | null;
}

export interface Herramienta {
  id: number;
  codigoUnico: string;
  nombre: string;
  marca: string;
  marcaId: number;
  tipo: string;
  tipoId: number;
  estado: EstadoHerramienta;
  ubicacionActual: "BODEGA" | "PROYECTO" | "TALLER" | "DESECHO";
  proyectoId: number | null;
  proyecto?: Proyecto | null;
}

export interface CreateHerramientaInput {
  nombre: string;
  marcaId: number;
  tipoId: number;
}
