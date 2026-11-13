export type FrecuenciaAlerta =
  "UNA_VEZ" | "DIARIA" | "CADA_N_DIAS" | "DIAS_ESPECIFICOS";
export type EstadoNotificacionAlerta = "NUEVA" | "VISUALIZADA" | "ATENDIDA";

export interface ConfiguracionAlerta {
  id: number;
  nombre: string;
  descripcion: string | null;
  proyectoId: number;
  proyecto: {
    id: number;
    nombre: string;
    estado: string;
    fechaFin: string | null;
  };
  diasAntes: number;
  canal: "INTERNA";
  frecuencia: FrecuenciaAlerta;
  cadaNDias: number | null;
  diasEspecificos: number[];
  activa: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface NotificacionAlerta {
  id: number;
  configuracionId: number | null;
  proyectoId: number | null;
  destinatarioId: number | null;
  creadaPorId: number | null;
  nombreConfiguracion: string;
  nombreProyecto: string;
  descripcion: string | null;
  estado: EstadoNotificacionAlerta;
  primeraGeneracion: string;
  ultimaGeneracion: string;
  ultimaFechaProgramada: string;
  visualizadaAt: string | null;
  atendidaAt: string | null;
  esDestinatario: boolean;
  destinatario: {
    id: number;
    name: string;
    lastName: string;
    email: string;
    empleado: { nombreCompleto: string } | null;
  } | null;
  creadaPor: { id: number; name: string; lastName: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginaNotificacionesAlerta {
  items: NotificacionAlerta[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProyectoDisponibleAlerta {
  id: number;
  nombre: string;
  fechaFin: string | null;
  empleados: {
    id: number;
    nombreCompleto: string;
    cargo: string | null;
    tieneUsuarioActivo: boolean;
  }[];
}

export interface DatosNotificacionAlerta {
  proyectoId: number;
  nombre: string;
  descripcion: string;
  todosAsignados: boolean;
  empleadoIds: number[];
}

export interface AuditoriaAlerta {
  id: number;
  configuracionId: number | null;
  usuarioId: number | null;
  accion: "CREADA" | "EDITADA" | "ELIMINADA";
  datos: string;
  createdAt: string;
  usuario: { id: number; name: string; lastName: string; email: string } | null;
  configuracion?: {
    id: number;
    nombre: string;
    proyecto: { id: number; nombre: string };
  } | null;
}

export interface DatosConfiguracionAlerta {
  nombre: string;
  descripcion?: string;
  proyectoId: number;
  diasAntes: number;
  canal: "INTERNA";
  frecuencia: FrecuenciaAlerta;
  cadaNDias?: number;
  diasEspecificos?: number[];
  activa?: boolean;
}
