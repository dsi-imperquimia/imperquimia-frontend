import { http } from "@lib/http";
import type {
  AuditoriaAlerta,
  ConfiguracionAlerta,
  DatosConfiguracionAlerta,
  DatosNotificacionAlerta,
  NotificacionAlerta,
  PaginaNotificacionesAlerta,
  ProyectoDisponibleAlerta,
} from "../types/alerta";

export async function listProyectosDisponiblesAlerta() {
  const { data } = await http.get<ProyectoDisponibleAlerta[]>(
    "/alertas/proyectos-disponibles",
  );
  return data;
}

export async function crearNotificacionAlerta(datos: DatosNotificacionAlerta) {
  const { data } = await http.post<{ mensaje: string }>(
    "/alertas/notificaciones",
    datos,
  );
  return data;
}

export async function contarAlertasNoLeidas() {
  const { data } = await http.get<number>("/alertas/notificaciones/no-leidas");
  return data;
}

export async function listConfiguracionesAlerta() {
  const { data } = await http.get<ConfiguracionAlerta[]>(
    "/alertas/configuraciones",
  );
  return data;
}

export async function crearConfiguracionAlerta(
  datos: DatosConfiguracionAlerta,
) {
  const { data } = await http.post<ConfiguracionAlerta>(
    "/alertas/configuraciones",
    datos,
  );
  return data;
}

export async function actualizarConfiguracionAlerta(
  id: number,
  datos: DatosConfiguracionAlerta,
) {
  const { data } = await http.patch<ConfiguracionAlerta>(
    `/alertas/configuraciones/${id}`,
    datos,
  );
  return data;
}

export async function eliminarConfiguracionAlerta(id: number) {
  await http.delete(`/alertas/configuraciones/${id}`);
}

export async function historialConfiguracionAlerta(id: number) {
  const { data } = await http.get<AuditoriaAlerta[]>(
    `/alertas/configuraciones/${id}/historial`,
  );
  return data;
}

export async function listAuditoriaAlerta() {
  const { data } = await http.get<AuditoriaAlerta[]>("/alertas/auditoria");
  return data;
}
export async function listNotificacionesAlerta(page = 1, pageSize = 10) {
  const { data } = await http.get<PaginaNotificacionesAlerta>(
    "/alertas/notificaciones",
    { params: { page, pageSize } },
  );
  return data;
}

export async function detalleNotificacionAlerta(id: number) {
  const { data } = await http.get<NotificacionAlerta>(
    `/alertas/notificaciones/${id}`,
  );
  return data;
}

export async function visualizarNotificacionAlerta(id: number) {
  const { data } = await http.patch<NotificacionAlerta>(
    `/alertas/notificaciones/${id}/visualizar`,
  );
  return data;
}

export async function atenderNotificacionAlerta(id: number) {
  const { data } = await http.patch<NotificacionAlerta>(
    `/alertas/notificaciones/${id}/atender`,
  );
  return data;
}
