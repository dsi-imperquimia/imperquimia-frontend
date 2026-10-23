import { http } from "@lib/http";

export interface TipoHerramienta {
  id: number;
  nombre: string;
  activo: boolean;
}

export async function listTiposHerramienta(soloActivos = false) {
  const { data } = await http.get<TipoHerramienta[]>("/tipos-herramienta", {
    params: { soloActivos },
  });
  return data;
}

export async function createTipoHerramienta(nombre: string) {
  const { data } = await http.post<TipoHerramienta>("/tipos-herramienta", {
    nombre,
  });
  return data;
}

export async function updateTipoHerramienta(id: number, nombre: string) {
  const { data } = await http.patch<TipoHerramienta>(
    `/tipos-herramienta/${id}`,
    { nombre },
  );
  return data;
}

export async function setTipoHerramientaActivo(id: number, activo: boolean) {
  const accion = activo ? "activar" : "desactivar";
  const { data } = await http.patch<TipoHerramienta>(
    `/tipos-herramienta/${id}/${accion}`,
  );
  return data;
}
