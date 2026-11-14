export type EstadoProyecto =
  | "ACTIVO"
  | "EN_PAUSA"
  | "FINALIZADO"
  | "PAGADO"
  | "GARANTIA"
  | "CANCELADO";
// Estados que se pueden asignar desde la edición general del proyecto (GPRCIMPER-27).
// CANCELADO pasa por las mismas validaciones que el flujo dedicado (GPRCIMPER-28).
export type EstadoEditableProyecto =
  | "ACTIVO"
  | "EN_PAUSA"
  | "FINALIZADO"
  | "PAGADO"
  | "GARANTIA"
  | "CANCELADO";
export type TipoObra =
  | "RESIDENCIAL"
  | "COMERCIAL"
  | "INDUSTRIAL"
  | "INFRAESTRUCTURA"
  | "OTRO";
export const TIPOS_OBRA_LABEL: Record<TipoObra, string> = {
  RESIDENCIAL: "Residencial",
  COMERCIAL: "Comercial",
  INDUSTRIAL: "Industrial",
  INFRAESTRUCTURA: "Infraestructura",
  OTRO: "Otro",
};
export interface Proyecto {
  id: number;
  nombre: string;
  ubicacion?: string | null;
  descripcion?: string | null;
  cliente?: string | null;
  phone?: string | null;
  email?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  cotizacionId?: number | null;
  estado: EstadoProyecto;
  tipoObra?: TipoObra | null;
  presupuesto?: string | number | null;
  subTotal: string | number;
  totalIva: string | number;
  total: string | number;
  jefeProyectoId?: number | null;
}
export interface ProyectoDetalle extends Proyecto {
  creadoPor?: { id: number; name: string; lastName: string } | null;
  jefeProyecto?: {
    id: number;
    nombreCompleto: string;
    activo: boolean;
    cargo?: { nombre: string } | null;
  } | null;
  herramientas: {
    id: number;
    nombre: string;
    codigoUnico: string;
    estado: string;
  }[];
  empleados: {
    empleadoId: number;
    fechaAsignacion: string;
    fechaRetiro?: string | null;
    empleado: {
      id: number;
      nombreCompleto: string;
      activo: boolean;
      cargo?: { nombre: string } | null;
      habilidades: { habilidadId: number; habilidad: { nombre: string } }[];
    };
  }[];
  detalles: {
    id: number;
    material: { id: number; nombre: string };
    cantidad: string | number;
    unidad: string;
    costoUnitario: string | number;
    subTotal: string | number;
    totalIva: string | number;
    total: string | number;
  }[];
}
export const dinero = (valor: string | number) =>
  new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(
    Number(valor),
  );
export const fecha = (valor?: string | null) =>
  valor
    ? new Intl.DateTimeFormat("es-SV", { timeZone: "UTC" }).format(
        new Date(valor),
      )
    : "Sin definir";
