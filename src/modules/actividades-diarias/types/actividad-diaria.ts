export interface ProyectoDisponibleActividad {
  id: number;
  nombre: string;
  cliente?: string | null;
  ubicacion?: string | null;
  estado: string;
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

export interface EvidenciaActividadDiaria {
  id: number;
  actividadDiariaId: number;
  nombreOriginal: string;
  mimeType: string;
  tamanoBytes: number;
  createdAt: string;
}

export const MAX_TAMANO_IMAGEN_BYTES = 10 * 1024 * 1024;
export const MAX_ARCHIVOS_EVIDENCIA = 10;
export const TIPOS_IMAGEN_PERMITIDOS = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export function formatearTamanoArchivo(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export interface ActividadDiaria {
  id: number;
  claveOperacion: string;
  proyectoId: number;
  usuarioId: number;
  empleadoId: number | null;
  fecha: string;
  nombre: string;
  descripcion: string;
  observaciones?: string | null;
  createdAt: string;
  updatedAt: string;
  proyecto?: {
    id: number;
    nombre: string;
    estado: string;
  };
  usuario?: {
    id: number;
    name: string;
    lastName: string;
  };
  empleado?: {
    id: number;
    nombreCompleto: string;
  } | null;
  evidencias?: EvidenciaActividadDiaria[];
}

export interface RegistrarActividadDiaria {
  claveOperacion: string;
  proyectoId: number;
  fecha: string;
  nombre: string;
  descripcion: string;
  observaciones?: string;
}

export interface ActualizarActividadDiaria {
  proyectoId?: number;
  fecha?: string;
  nombre: string;
  descripcion: string;
  observaciones?: string;
}

export interface BorradorActividad {
  claveOperacion: string;
  payload: RegistrarActividadDiaria;
  proyectoNombre?: string;
  guardadoEn: string;
  ultimoError?: string;
}

export interface ErroresActividadDiaria {
  campos: Partial<Record<keyof RegistrarActividadDiaria, string>>;
  general?: string;
}

export const MENSAJES_ACTIVIDAD = {
  exito: "¡Registro guardado con éxito!",
  editadoExito: "¡Registro editado con éxito!",
  errorConexion: "Error al guardar, tu trabajo se ha movido a los borradores",
} as const;

export const DURACION_MINIMA_MODAL_MS = 3000;
export const PLAZO_EDICION_HORAS = 48;
export const PLAZO_EDICION_MS = PLAZO_EDICION_HORAS * 60 * 60 * 1000;

export interface FiltroActividadesDiarias {
  proyectoId?: number | null;
  fechaInicio?: string;
  fechaFin?: string;
}

export type FormatoExportacionActividad = "pdf" | "excel";

function formatearFechaLocalIso(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

/** Fecha local de hoy en formato AAAA-MM-DD (para inputs type="date"). */
export function fechaHoyIso(): string {
  return formatearFechaLocalIso(new Date());
}

/** Resta `dias` días calendario locales a `fechaBaseIso` (o a hoy) en formato AAAA-MM-DD. */
export function restarDiasIso(dias: number, fechaBaseIso?: string): string {
  const fecha = fechaBaseIso
    ? (() => {
        const [anio, mes, dia] = fechaBaseIso.split("-").map(Number);
        return new Date(anio, mes - 1, dia);
      })()
    : new Date();
  fecha.setDate(fecha.getDate() - dias);
  return formatearFechaLocalIso(fecha);
}

/** Normaliza texto para búsquedas sin tildes ni mayúsculas. */
export function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

export function esRolAdministrador(rolNombre?: string | null): boolean {
  if (!rolNombre) return false;
  const normalizado = normalizarTexto(rolNombre);
  return normalizado === "administrador" || normalizado === "administracion";
}

export function puedeEditarActividad(
  createdAt: string | Date,
  rolNombre?: string | null,
  ahoraMs: number = Date.now(),
): boolean {
  if (esRolAdministrador(rolNombre)) return true;
  const fechaCreacionMs = new Date(createdAt).getTime();
  if (!Number.isFinite(fechaCreacionMs)) return false;
  return ahoraMs - fechaCreacionMs < PLAZO_EDICION_MS;
}
