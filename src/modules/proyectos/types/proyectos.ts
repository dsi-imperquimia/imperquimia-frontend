export type EstadoProyecto = "ACTIVO" | "FINALIZADO" | "PAGADO" | "GARANTIA";
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
  subTotal: string | number;
  totalIva: string | number;
  total: string | number;
}
export interface ProyectoDetalle extends Proyecto {
  creadoPor?: { id: number; name: string; lastName: string } | null;
  herramientas: {
    id: number;
    nombre: string;
    codigoUnico: string;
    estado: string;
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
