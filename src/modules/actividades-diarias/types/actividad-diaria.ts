export interface ProyectoDisponibleActividad {
  id: number;
  nombre: string;
  cliente?: string | null;
  ubicacion?: string | null;
  estado: string;
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

export interface ActividadDiaria {
  id: number;
  claveOperacion: string;
  proyectoId: number;
  usuarioId: number;
  empleadoId: number | null;
  fecha: string;
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
}

export interface RegistrarActividadDiaria {
  claveOperacion: string;
  proyectoId: number;
  fecha: string;
  descripcion: string;
  observaciones?: string;
}

export interface ActualizarActividadDiaria {
  fecha?: string;
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

export function esRolAdministrador(rolNombre?: string | null): boolean {
  if (!rolNombre) return false;
  const normalizado = rolNombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
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
