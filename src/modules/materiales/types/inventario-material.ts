export type TipoUbicacionMaterial = "BODEGA" | "PROYECTO";
export type TipoMovimientoMaterial = "ENTRADA" | "SALIDA" | "TRASLADO";
export type MotivoMovimientoMaterial =
  | "COMPRA"
  | "DEVOLUCION_PROYECTO"
  | "USO_PROYECTO"
  | "VENTA"
  | "CONSUMO_PROYECTO"
  | "MERMA_PROYECTO"
  | "CIERRE_PROYECTO"
  | "REVERSO_CONSUMO"
  | "OTRO";

export interface UbicacionMaterial {
  id: number;
  codigo: string;
  nombre: string;
  tipo: TipoUbicacionMaterial;
  proyectoId: number | null;
}

export interface ExistenciaMaterial {
  id: number;
  cantidad: string | number;
  material: {
    id: number;
    codigo: string | null;
    nombre: string;
    unidad: string;
    estado: boolean;
  };
  ubicacion: UbicacionMaterial;
}

export interface MovimientoMaterial {
  id: number;
  claveOperacion: string;
  cantidad: string | number;
  tipo: TipoMovimientoMaterial;
  motivo: MotivoMovimientoMaterial;
  observacion: string | null;
  fechaMovimiento: string;
  material: {
    id: number;
    codigo: string | null;
    nombre: string;
    unidad: string;
  };
  origen: UbicacionMaterial | null;
  destino: UbicacionMaterial | null;
  usuario: { id: number; name: string; lastName: string };
}

export interface RegistrarMovimientoMaterial {
  claveOperacion: string;
  materialId: number;
  cantidad: number;
  motivo: MotivoMovimientoMaterial;
  proyectoId?: number;
  observacion?: string;
}

export interface RegistrarSalidaMaterialesProyecto {
  proyectoId: number;
  materiales: Array<{
    claveOperacion: string;
    materialId: number;
    cantidad: number;
  }>;
  observacion?: string;
}

export type RegistrarDevolucionMaterialesProyecto =
  RegistrarSalidaMaterialesProyecto;

export const MOTIVO_LABEL: Record<MotivoMovimientoMaterial, string> = {
  COMPRA: "Compra / adquisición",
  DEVOLUCION_PROYECTO: "Devolución de proyecto",
  USO_PROYECTO: "Uso en proyecto",
  VENTA: "Venta",
  CONSUMO_PROYECTO: "Consumo en proyecto",
  MERMA_PROYECTO: "Merma en proyecto",
  CIERRE_PROYECTO: "Consumo al cerrar proyecto",
  REVERSO_CONSUMO: "Corrección de consumo",
  OTRO: "Otro",
};
