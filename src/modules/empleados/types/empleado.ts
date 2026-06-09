import type { Cargo } from "@modules/cargo-empleado/types/cargo";

export interface Empleado {
  id: number;
  nombreCompleto: string;
  dui: string;
  nit: string;
  cargo?: Cargo;
  cargoId: number;
  activo: boolean;
  fechaRegistro: Date;
  createdAt?: Date;
}
