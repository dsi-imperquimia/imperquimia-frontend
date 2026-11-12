export interface ProyectoAsignado {
  id: number;
  nombre: string;
  estado: string;
  roles: ("TECNICO" | "JEFE")[];
}

export interface AsignacionEmpleado {
  empleadoId: number;
  nombreCompleto: string;
  cargo: string | null;
  activo: boolean;
  proyectos: ProyectoAsignado[];
  cargaHoraria: number;
  sobreasignado: boolean;
}
