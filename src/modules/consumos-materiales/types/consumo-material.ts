export type ClasificacionConsumoMaterial = "PRODUCCION" | "PERDIDA" | "CIERRE";
export type FuenteConsumoMaterial = "MANUAL" | "BITACORA" | "CIERRE_PROYECTO";

export interface MaterialConsumo {
  id: number;
  codigo: string | null;
  nombre: string;
  unidad: string;
}

export interface ResumenMaterialProyecto {
  material: MaterialConsumo;
  presupuestado: string | number;
  entregado: string | number;
  devuelto: string | number;
  produccion: string | number;
  merma: string | number;
  cierre: string | number;
  consumido: string | number;
  existenciaActual: string | number;
}

export interface ConsumoMaterial {
  id: number;
  claveOperacion: string;
  proyectoId: number;
  materialId: number;
  cantidad: string | number;
  clasificacion: ClasificacionConsumoMaterial;
  fuente: FuenteConsumoMaterial;
  motivo: string | null;
  fechaJornada: string;
  actividadReferencia: string | null;
  reporteReferencia: string | null;
  anuladoAt: string | null;
  motivoAnulacion: string | null;
  material: MaterialConsumo;
  usuario: { id: number; name: string; lastName: string };
  anuladoPor: { id: number; name: string; lastName: string } | null;
}

export interface ConsumosProyectoResponse {
  proyecto: { id: number; nombre: string; estado: string };
  resumen: ResumenMaterialProyecto[];
  consumos: ConsumoMaterial[];
}

export interface RegistrarConsumoMaterial {
  claveOperacion: string;
  proyectoId: number;
  materialId: number;
  cantidad: number;
  clasificacion: "PRODUCCION" | "PERDIDA";
  fechaJornada: string;
  motivo?: string;
}

export interface DesviacionConsumo {
  id: number;
  regla: "EXCESO_COTIZADO";
  valorObservado: string | number;
  valorReferencia: string | number;
  factorUmbral: string | number;
  estado: "PENDIENTE" | "REVISADA" | "DESCARTADA";
  material: MaterialConsumo;
  consumo: {
    id: number;
    cantidad: string | number;
    fechaJornada: string;
    clasificacion: ClasificacionConsumoMaterial;
    fuente: FuenteConsumoMaterial;
  };
}
