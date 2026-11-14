export interface MiAsignacion {
  id: number;
  nombre: string;
  ubicacion?: string | null;
  estado: string;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  vista: boolean;
  vistaAt?: string | null;
}

export interface MisAsignaciones {
  items: MiAsignacion[];
  pendientes: number;
}

export interface MiAsignacionDetalle extends MiAsignacion {
  descripcion?: string | null;
  jefeProyecto: { nombreCompleto: string; email: string | null } | null;
}
