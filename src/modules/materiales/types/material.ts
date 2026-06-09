export interface Material {
  id: number;
  nombre: string;
  descripcion?: string | null;
  unidad: string;
  costoUnitario: number;
  estado: boolean;
  codigo?: string | null;
  fichaTecnica?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
