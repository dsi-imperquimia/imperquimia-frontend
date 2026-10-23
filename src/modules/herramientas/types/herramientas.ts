import type { Proyecto } from '@/modules/proyectos/types/proyectos';

export enum EstadoHerramienta {
  DISPONIBLE = 'DISPONIBLE',
  EN_PROYECTO = 'EN_PROYECTO',
  MANTENIMIENTO = 'MANTENIMIENTO',
  DANADA = 'DANADA',
  DESECHO = 'DESECHO',
}

export interface Herramienta {
  id: number;
  codigoUnico: string;
  nombre: string;
  marca: string;
  marcaId: number;
  tipo: string;
  tipoId: number;
  estado: EstadoHerramienta;
  proyectoId: number | null;
  proyecto?: Proyecto | null;
}

export interface CreateHerramientaInput {
  nombre: string;
  marcaId: number;
  tipoId: number;
}
