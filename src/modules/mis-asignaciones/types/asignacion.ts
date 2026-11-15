import type { TipoObra } from "@modules/proyectos/types/proyectos";

export type PrioridadAsignacion = "ALTA" | "MEDIA" | "BAJA";

export interface MiAsignacion {
  id: number;
  nombre: string;
  ubicacion?: string | null;
  estado: string;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  vista: boolean;
  vistaAt?: string | null;
  /** true si el empleado es el jefe de proyecto de esta obra. */
  esJefe: boolean;
  /** Según qué tan cerca está la fecha de inicio del proyecto. */
  prioridad: PrioridadAsignacion;
}

export interface MisAsignaciones {
  items: MiAsignacion[];
  pendientes: number;
}

export interface MiAsignacionDetalle extends MiAsignacion {
  descripcion?: string | null;
  cliente?: string | null;
  tipoObra?: TipoObra | null;
  jefeProyecto: { nombreCompleto: string; email: string | null } | null;
  /** Resto del equipo con asignación vigente en la obra (sin incluirse a uno mismo). */
  equipo: { nombreCompleto: string; cargo: string | null }[];
}
