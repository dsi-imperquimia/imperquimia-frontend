import { http } from "@lib/http";
import type { Proyecto } from "../types/proyectos";
import { isAxiosError } from "axios";
export interface DatosProyecto {
  nombre: string;
  cliente: string;
  descripcion: string;
  ubicacion: string;
  phone: string;
  email: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface ErroresProyecto {
  campos: Partial<Record<keyof DatosProyecto, string>>;
  general?: string;
}

export async function guardarProyecto(datos: DatosProyecto, id?: number) {
  const { data } = id
    ? await http.patch<Proyecto>(`/proyectos/${id}`, datos)
    : await http.post<Proyecto>("/proyectos", datos);
  return data;
}
export async function eliminarProyecto(id: number) {
  await http.delete(`/proyectos/${id}`);
}
export function errorProyecto(error: unknown) {
  const mensaje: unknown = isAxiosError(error)
    ? error.response?.data?.message
    : null;

  const campos: ErroresProyecto["campos"] = {};

  if (mensaje && typeof mensaje === "object" && !Array.isArray(mensaje)) {
    const mensajesPorCampo: Partial<Record<keyof DatosProyecto, string>> = {
      nombre: "Ingresa el nombre del proyecto.",
      cliente: "Ingresa el nombre del cliente.",
      email: "Ingresa un correo válido, por ejemplo nombre@dominio.com.",
      fechaInicio: "Ingresa una fecha de inicio válida en formato AAAA-MM-DD.",
      fechaFin:
        "Ingresa una fecha de fin válida en formato AAAA-MM-DD y que no sea anterior al inicio.",
    };

    for (const campo of Object.keys(mensaje)) {
      const campoTipado = campo as keyof DatosProyecto;
      const mensajeCampo = mensajesPorCampo[campoTipado];
      if (mensajeCampo) {
        campos[campoTipado] = mensajeCampo;
      }
    }

    if (Object.keys(campos).length > 0) return { campos };
  }

  if (
    typeof mensaje === "string" &&
    mensaje.toLocaleLowerCase().includes("fecha")
  ) {
    return {
      campos: {
        fechaFin:
          "La fecha de fin debe ser igual o posterior a la fecha de inicio.",
      },
    };
  }

  if (typeof mensaje === "string") return { campos, general: mensaje };

  return {
    campos,
    general: "No se pudo guardar el proyecto. Inténtalo de nuevo.",
  };
}
