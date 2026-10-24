import { http } from "@lib/http";

export interface MarcaHerramienta {
  id: number;
  nombre: string;
  activo: boolean;
}

export async function listMarcasHerramienta(soloActivas = false) {
  const { data } = await http.get<MarcaHerramienta[]>("/marcas-herramientas", {
    params: { soloActivas },
  });
  return data;
}

export async function createMarcaHerramienta(nombre: string) {
  const { data } = await http.post<MarcaHerramienta>("/marcas-herramientas", {
    nombre,
  });
  return data;
}

export async function updateMarcaHerramienta(id: number, nombre: string) {
  const { data } = await http.patch<MarcaHerramienta>(
    `/marcas-herramientas/${id}`,
    { nombre },
  );
  return data;
}

export async function setMarcaHerramientaActiva(id: number, activa: boolean) {
  const accion = activa ? "activar" : "desactivar";
  const { data } = await http.patch<MarcaHerramienta>(
    `/marcas-herramientas/${id}/${accion}`,
  );
  return data;
}
