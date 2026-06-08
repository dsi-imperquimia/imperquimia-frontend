import { http } from "@lib/http";
import type { Proyecto } from "../types/proyectos";

export async function listProyectos() {
  const { data } = await http.get<Proyecto[]>("/proyectos");
  return data;
}