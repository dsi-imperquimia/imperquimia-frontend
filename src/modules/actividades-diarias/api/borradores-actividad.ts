import type { BorradorActividad } from "../types/actividad-diaria";
import {
  errorActividadDiaria,
  esErrorDeConexion,
  registrarActividadDiaria,
} from "./actividades-diarias";

const STORAGE_PREFIX = "imperquimia:borradores-actividad:";

const memoriaStorage = new Map<string, string>();

function obtenerStorage(): Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  if (typeof window !== "undefined") {
    try {
      const candidate = window.localStorage as Partial<Storage> | undefined;
      if (
        candidate &&
        typeof candidate.getItem === "function" &&
        typeof candidate.setItem === "function" &&
        typeof candidate.removeItem === "function"
      ) {
        return candidate as Storage;
      }
    } catch {
      // continuar al respaldo en memoria
    }
  }
  return {
    getItem: (key) => memoriaStorage.get(key) ?? null,
    setItem: (key, value) => {
      memoriaStorage.set(key, value);
    },
    removeItem: (key) => {
      memoriaStorage.delete(key);
    },
  };
}

export function obtenerClaveStorageBorradores(userId?: number | null): string {
  return `${STORAGE_PREFIX}${userId ?? "anon"}`;
}

export function listarBorradoresActividad(
  userId?: number | null,
): BorradorActividad[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = obtenerStorage().getItem(obtenerClaveStorageBorradores(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is BorradorActividad =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as BorradorActividad).claveOperacion === "string" &&
        typeof (item as BorradorActividad).payload === "object",
    );
  } catch {
    return [];
  }
}

function persistirBorradores(
  userId: number | null | undefined,
  borradores: BorradorActividad[],
): void {
  if (typeof window === "undefined") return;
  const key = obtenerClaveStorageBorradores(userId);
  try {
    const storage = obtenerStorage();
    if (borradores.length === 0) {
      storage.removeItem(key);
    } else {
      storage.setItem(key, JSON.stringify(borradores));
    }
  } catch {
    // modo privado o cuota excedida
  }
}

export function guardarBorradorActividad(
  userId: number | null | undefined,
  borrador: BorradorActividad,
): BorradorActividad[] {
  const actuales = listarBorradoresActividad(userId);
  const indice = actuales.findIndex(
    (item) => item.claveOperacion === borrador.claveOperacion,
  );
  const siguientes =
    indice >= 0
      ? actuales.map((item, idx) => (idx === indice ? borrador : item))
      : [...actuales, borrador];
  persistirBorradores(userId, siguientes);
  return siguientes;
}

export function eliminarBorradorActividad(
  userId: number | null | undefined,
  claveOperacion: string,
): BorradorActividad[] {
  const siguientes = listarBorradoresActividad(userId).filter(
    (item) => item.claveOperacion !== claveOperacion,
  );
  persistirBorradores(userId, siguientes);
  return siguientes;
}

export function marcarErrorBorradorActividad(
  userId: number | null | undefined,
  claveOperacion: string,
  mensajeError: string,
): BorradorActividad[] {
  const siguientes = listarBorradoresActividad(userId).map((item) =>
    item.claveOperacion === claveOperacion
      ? { ...item, ultimoError: mensajeError }
      : item,
  );
  persistirBorradores(userId, siguientes);
  return siguientes;
}

export interface ResultadoReenvioBorradores {
  enviados: number;
  pendientes: BorradorActividad[];
  detenidoPorConexion: boolean;
}

export async function reenviarBorradoresActividad(
  userId: number | null | undefined,
  enviar: typeof registrarActividadDiaria = registrarActividadDiaria,
): Promise<ResultadoReenvioBorradores> {
  const borradores = listarBorradoresActividad(userId);
  let enviados = 0;
  let detenidoPorConexion = false;

  for (const borrador of borradores) {
    try {
      await enviar(borrador.payload);
      eliminarBorradorActividad(userId, borrador.claveOperacion);
      enviados += 1;
    } catch (error) {
      if (esErrorDeConexion(error)) {
        detenidoPorConexion = true;
        break;
      }
      const detalle = errorActividadDiaria(error);
      marcarErrorBorradorActividad(
        userId,
        borrador.claveOperacion,
        detalle.general ?? "No se pudo reenviar el borrador.",
      );
    }
  }

  return {
    enviados,
    pendientes: listarBorradoresActividad(userId),
    detenidoPorConexion,
  };
}
