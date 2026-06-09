export interface Material {
  id: number;
  nombre: string;
  descripcion?: string | null;
  unidad: string;
  costoUnitario: number;
  estado: boolean;
  createdAt?: string;
  updatedAt?: string;
}
