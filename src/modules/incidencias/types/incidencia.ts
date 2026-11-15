export type PrioridadIncidencia = "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
export type EstadoIncidencia = "ABIERTA" | "EN_PROCESO" | "RESUELTA";

export const PRIORIDADES: PrioridadIncidencia[] = [
  "BAJA",
  "MEDIA",
  "ALTA",
  "CRITICA",
];
export const ESTADOS: EstadoIncidencia[] = [
  "ABIERTA",
  "EN_PROCESO",
  "RESUELTA",
];

export const ETIQUETA_PRIORIDAD: Record<PrioridadIncidencia, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  CRITICA: "Crítica",
};

export const ETIQUETA_ESTADO: Record<EstadoIncidencia, string> = {
  ABIERTA: "Abierta",
  EN_PROCESO: "En proceso",
  RESUELTA: "Resuelta",
};

export interface UsuarioResumen {
  id: number;
  name: string;
  lastName: string;
}

export interface HistorialIncidencia {
  id: number;
  incidenciaId: number;
  usuarioId: number;
  estadoAnterior: EstadoIncidencia | null;
  estadoNuevo: EstadoIncidencia;
  comentario: string | null;
  createdAt: string;
  usuario?: UsuarioResumen;
}

export interface JornadaResumen {
  id: number;
  nombre: string;
  fecha: string;
  proyectoId?: number;
}

export interface Incidencia {
  id: number;
  claveOperacion: string;
  proyectoId: number;
  usuarioId: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  prioridad: PrioridadIncidencia;
  estado: EstadoIncidencia;
  actividadDiariaId: number | null;
  createdAt: string;
  updatedAt: string;
  proyecto?: { id: number; nombre: string; estado?: string };
  usuario?: UsuarioResumen;
  actividadDiaria?: JornadaResumen | null;
  historial?: HistorialIncidencia[];
}

export interface IncidenciaResumenJornada {
  id: number;
  titulo: string;
  prioridad: PrioridadIncidencia;
  estado: EstadoIncidencia;
}

export interface RegistrarIncidencia {
  claveOperacion: string;
  proyectoId: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  prioridad: PrioridadIncidencia;
  /** Reporte de jornada al que nace vinculada (GPRCIMPER-142). */
  actividadDiariaId?: number;
}

export interface ActualizarIncidencia {
  titulo?: string;
  descripcion?: string;
  fecha?: string;
  prioridad?: PrioridadIncidencia;
}

export interface FiltroIncidencias {
  proyectoId?: number | null;
  estado?: EstadoIncidencia | "";
  prioridad?: PrioridadIncidencia | "";
  actividadDiariaId?: number | null;
}

export interface ErroresIncidencia {
  campos: Partial<Record<keyof RegistrarIncidencia, string>>;
  general?: string;
}

/** Fecha local de hoy en formato AAAA-MM-DD (para inputs type="date"). */
export function fechaHoyIso(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}
