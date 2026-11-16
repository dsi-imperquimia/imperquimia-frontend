export type EstadoVerificacionHerramienta = "PENDIENTE" | "VERIFICADA" | "AUSENTE";

export const ETIQUETA_ESTADO_VERIFICACION: Record<
  EstadoVerificacionHerramienta,
  string
> = {
  PENDIENTE: "Pendiente",
  VERIFICADA: "Verificada",
  AUSENTE: "Ausente",
};

export interface HerramientaResumenJornada {
  id: number;
  codigoUnico: string;
  nombre: string;
  estado: string;
  tipo?: { nombre: string };
}

export interface JornadaHerramientaItem {
  id: number;
  herramientaId: number;
  herramienta: HerramientaResumenJornada;
  estadoInicio: EstadoVerificacionHerramienta;
  observacionInicio: string | null;
  estadoRetorno: EstadoVerificacionHerramienta;
  observacionRetorno: string | null;
  incidenciaId: number | null;
  incidencia?: { id: number; titulo: string; estado: string } | null;
}

export interface JornadaHerramientas {
  id: number;
  claveOperacion: string;
  proyectoId: number;
  empleadoId: number;
  fecha: string;
  verificacionInicioAt: string | null;
  verificacionRetornoAt: string | null;
  proyecto: { id: number; nombre: string; estado: string };
  empleado: { id: number; nombreCompleto: string };
  items: JornadaHerramientaItem[];
}

export interface AbrirJornadaHerramientas {
  claveOperacion: string;
  proyectoId: number;
  empleadoId: number;
  fecha: string;
}

export interface HerramientaPendiente {
  itemId: number;
  herramientaId: number;
  codigoUnico: string;
  nombre: string;
}

export interface ErrorConfirmarVerificacion {
  general: string;
  herramientasPendientes: HerramientaPendiente[];
}

/** Fecha local de hoy en formato AAAA-MM-DD (para inputs type="date"). */
export function fechaHoyIso(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}
