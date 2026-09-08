import type { Cargo } from "@modules/cargo-empleado/types/cargo";
import type { HabilidadEmpleado } from "./habilidad";

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
  habilidades: HabilidadEmpleado[]; // Agregado para cumplir PBI-89
}
