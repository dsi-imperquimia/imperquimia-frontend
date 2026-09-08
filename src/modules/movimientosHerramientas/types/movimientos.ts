import { EstadoHerramienta } from '@/modules/herramientas/types/herramientas';

export enum AreaMovimiento {
  BODEGA = 'BODEGA',
  PROYECTO = 'PROYECTO',
  TALLER = 'TALLER',
  DESECHO = 'DESECHO',
}

export interface MovimientoHerramienta {
  id: number;
  herramientaId: number;
  usuarioId: number;
  origen: AreaMovimiento;
  destino: AreaMovimiento;
  proyectoDestinoId: number | null;
  estadoHerramienta: EstadoHerramienta;
  observaciones: string | null;
  fechaMovimiento: string;
}

export interface CreateMovimientoInput {
  herramientaId: number;
  origen: AreaMovimiento;
  destino: AreaMovimiento;
  proyectoDestinoId?: number | null; // Obligatorio solo si destino === PROYECTO
  conDano?: boolean; // Solo se permite si destino === BODEGA
  observaciones?: string;
}