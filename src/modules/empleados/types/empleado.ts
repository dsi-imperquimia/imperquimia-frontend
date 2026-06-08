export interface Empleado {
  id: number;
  nombreCompleto: string;
  dui: string;
  nit: string;
  cargoId: number;
  activo: boolean;
  fechaRegistro: Date;
  createdAt?: Date;
}