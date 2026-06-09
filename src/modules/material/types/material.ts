export interface Material {
  id: number;
  nombre: string;
  descripcion?: string | null;
  unidad: string;
  costoUnitario: string;
  estado: boolean;
  createdAt: string;
  updatedAt: string;
}