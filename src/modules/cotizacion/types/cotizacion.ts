import type { Material } from "@modules/materiales/types/material";

export type EstadoCotizacion =
  | "PENDIENTE"
  | "APROBADA"
  | "RECHAZADA";

export interface DetalleInput {
  materialId: number;
  cantidad: number;
}

export interface CreateCotizacion {
  descripcion: string;
  cliente: string;
  phone: string;
  email: string;
  detalles: DetalleInput[];
}

export interface UpdateCotizacion extends CreateCotizacion {}

export interface UserCotizacionList {
  lastName: string;
}

export interface UserCotizacionDetalle {
  id: number;
  name: string;
  lastName: string;
  email: string;
}

export interface DetalleCotizacion {
  id: number;
  cotizacionId: number;
  materialId: number;
  cantidad: string;
  unidad: string;
  costoUnitario: string;
  subTotal: string;
  totalIva: string;
  total: string;
  createdAt: string;
  updatedAt: string;
  material: Material;
}

export interface CotizacionList {
  id: number;
  descripcion: string;
  cliente: string;
  phone: string;
  email: string;
  userId: number;
  subTotal: string;
  totalIva: string;
  total: string;
  estado: EstadoCotizacion;
  createdAt: string;
  updatedAt: string;
  user: UserCotizacionList;
}

export interface CotizacionDetalle {
  id: number;
  descripcion: string;
  cliente: string;
  phone: string;
  email: string;
  userId: number;
  subTotal: string;
  totalIva: string;
  total: string;
  estado: EstadoCotizacion;
  createdAt: string;
  updatedAt: string;
  user: UserCotizacionDetalle;
  detalles: DetalleCotizacion[];
  estadoCambiadoPor: UsuarioCambioEstado | null;
  estadoCambiadoAt: string | null;
  proyecto: ProyectoCotizacion | null;
}
export interface UsuarioCambioEstado {
  id: number;
  name: string;
  lastName: string;
  email: string;
}
export interface ProyectoCotizacion {
  id: number;
  nombre: string;
  estado: string;
}