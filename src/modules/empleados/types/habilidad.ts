export interface Habilidad {
  id: number;
  nombre: string;
  descripcion?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HabilidadEmpleado {
  empleadoId: number;
  habilidadId: number;
  assignedAt: string;
  assignedBy?: string;
  habilidad: Habilidad;
}