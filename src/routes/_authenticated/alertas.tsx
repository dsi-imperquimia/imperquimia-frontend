import {
  actualizarConfiguracionAlerta,
  atenderNotificacionAlerta,
  crearConfiguracionAlerta,
  crearNotificacionAlerta,
  eliminarConfiguracionAlerta,
  historialConfiguracionAlerta,
  listAuditoriaAlerta,
  listConfiguracionesAlerta,
  listNotificacionesAlerta,
  listProyectosDisponiblesAlerta,
  visualizarNotificacionAlerta,
} from "@modules/alertas/api/alertas";
import type {
  AuditoriaAlerta,
  ConfiguracionAlerta,
  DatosConfiguracionAlerta,
  DatosNotificacionAlerta,
  FrecuenciaAlerta,
  NotificacionAlerta,
} from "@modules/alertas/types/alerta";
import { listProyectos } from "@modules/proyectos/api/listProyectos";
import { useAuth, userActions } from "@modules/auth/store/authStore";
import { Button } from "@heroui/react/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  History,
  Plus,
  Settings2,
  X,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/alertas")({
  component: Alertas,
});

type Pestana = "bandeja" | "configuraciones" | "historial";
type Subhistorial = "notificaciones" | "configuraciones";
type AlcanceDestinatarios = "TODOS" | "SELECCIONADOS";
type BorradorNotificacion = {
  proyectoId: string;
  nombre: string;
  descripcion: string;
  alcance: AlcanceDestinatarios;
  empleadoIds: string[];
};
type Borrador = {
  nombre: string;
  descripcion: string;
  proyectoId: string;
  diasAntes: string;
  frecuencia: FrecuenciaAlerta;
  cadaNDias: string;
  diasEspecificos: number[];
};
const BORRADOR_VACIO: Borrador = {
  nombre: "",
  descripcion: "",
  proyectoId: "",
  diasAntes: "7",
  frecuencia: "UNA_VEZ",
  cadaNDias: "2",
  diasEspecificos: [],
};
const DIAS = [
  { valor: 1, etiqueta: "Lun" },
  { valor: 2, etiqueta: "Mar" },
  { valor: 3, etiqueta: "Mié" },
  { valor: 4, etiqueta: "Jue" },
  { valor: 5, etiqueta: "Vie" },
  { valor: 6, etiqueta: "Sáb" },
  { valor: 0, etiqueta: "Dom" },
];
const textoFrecuencia: Record<FrecuenciaAlerta, string> = {
  UNA_VEZ: "Una vez",
  DIARIA: "Cada día",
  CADA_N_DIAS: "Cada N días",
  DIAS_ESPECIFICOS: "Días específicos",
};
const PLANTILLAS_VENCIMIENTO = [
  {
    dias: 7,
    nombre: "Proyecto próximo a vencer (7 días)",
    descripcion: "Revisar el avance y pendientes antes de la fecha de fin.",
  },
  {
    dias: 3,
    nombre: "Proyecto por vencer (3 días)",
    descripcion: "Confirmar los trabajos pendientes antes del vencimiento.",
  },
  {
    dias: 1,
    nombre: "El proyecto vence mañana",
    descripcion: "Revisar hoy los pendientes del proyecto.",
  },
] as const;
const fechaHora = (valor: string) =>
  new Intl.DateTimeFormat("es-SV", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(valor));
const nombreEstado = (estado: NotificacionAlerta["estado"]) =>
  estado === "NUEVA"
    ? "Nueva"
    : estado === "VISUALIZADA"
      ? "Visualizada"
      : "Atendida";
const mensajeError = (error: unknown) => {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: unknown } } })
      .response;
    if (typeof response?.data?.message === "string")
      return response.data.message;
  }
  return "No se pudo completar la operación. Inténtalo de nuevo.";
};

function Alertas() {
  const [pestana, setPestana] = useState<Pestana>("bandeja");
  const [subhistorial, setSubhistorial] =
    useState<Subhistorial>("notificaciones");
  const [paginaNotificaciones, setPaginaNotificaciones] = useState(1);
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [configuracionEditada, setConfiguracionEditada] =
    useState<ConfiguracionAlerta | null>(null);
  const [configuracionHistorial, setConfiguracionHistorial] =
    useState<ConfiguracionAlerta | null>(null);
  const [notificacionBorrador, setNotificacionBorrador] =
    useState<BorradorNotificacion | null>(null);
  const [notificacionDetalle, setNotificacionDetalle] =
    useState<NotificacionAlerta | null>(null);
  const [errorFormulario, setErrorFormulario] = useState("");
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const usuarioId = user?.id;
  const puedeCrearNotificacion = userActions.hasPermission("ALERTA_CREATE");
  const puedeLeerNotificaciones = userActions.hasPermission("ALERTA_READ");
  const puedeConfigurar = userActions.hasPermission("ALERTA_CONFIGURE");
  const configuraciones = useQuery({
    queryKey: ["alertas", "configuraciones", usuarioId],
    queryFn: listConfiguracionesAlerta,
    enabled: puedeConfigurar && !!usuarioId,
  });
  const notificaciones = useQuery({
    queryKey: ["alertas", "notificaciones", usuarioId, paginaNotificaciones],
    queryFn: () => listNotificacionesAlerta(paginaNotificaciones),
    refetchInterval: 60_000,
    enabled: puedeLeerNotificaciones && !!usuarioId,
  });
  const auditoriaGlobal = useQuery({
    queryKey: ["alertas", "auditoria-global", usuarioId],
    queryFn: listAuditoriaAlerta,
    enabled:
      puedeConfigurar &&
      !!usuarioId &&
      pestana === "historial" &&
      subhistorial === "configuraciones",
  });
  const proyectos = useQuery({
    queryKey: ["proyectos", usuarioId],
    queryFn: listProyectos,
    enabled: puedeConfigurar && !!usuarioId,
  });
  const proyectosNotificacion = useQuery({
    queryKey: ["alertas", "proyectos-disponibles", usuarioId],
    queryFn: listProyectosDisponiblesAlerta,
    enabled: puedeCrearNotificacion && !!usuarioId,
  });
  const auditoria = useQuery({
    queryKey: ["alertas", "historial", usuarioId, configuracionHistorial?.id],
    queryFn: () => historialConfiguracionAlerta(configuracionHistorial!.id),
    enabled: !!usuarioId && !!configuracionHistorial,
  });
  const refrescar = () =>
    queryClient.invalidateQueries({ queryKey: ["alertas"] });
  const crear = useMutation({
    mutationFn: crearConfiguracionAlerta,
    onSuccess: () => {
      setBorrador(null);
      setConfiguracionEditada(null);
      setErrorFormulario("");
      void refrescar();
    },
  });
  const crearNotificacion = useMutation({
    mutationFn: crearNotificacionAlerta,
    onSuccess: () => {
      setNotificacionBorrador(null);
      setErrorFormulario("");
      void refrescar();
    },
  });
  const actualizar = useMutation({
    mutationFn: ({
      id,
      datos,
    }: {
      id: number;
      datos: DatosConfiguracionAlerta;
    }) => actualizarConfiguracionAlerta(id, datos),
    onSuccess: () => {
      setBorrador(null);
      setConfiguracionEditada(null);
      setErrorFormulario("");
      void refrescar();
    },
  });
  const eliminar = useMutation({
    mutationFn: eliminarConfiguracionAlerta,
    onSuccess: refrescar,
  });
  const visualizar = useMutation({
    mutationFn: visualizarNotificacionAlerta,
    onSuccess: (data) => {
      setNotificacionDetalle(data);
      void refrescar();
    },
  });
  const atender = useMutation({
    mutationFn: atenderNotificacionAlerta,
    onSuccess: (data) => {
      setNotificacionDetalle(data);
      void refrescar();
    },
  });
  const puedeEditar = puedeConfigurar;
  const configItems = configuraciones.data ?? [];
  const alertaItems = notificaciones.data?.items ?? [];
  const proyectosActivos = (proyectos.data ?? []).filter(
    (proyecto) => proyecto.estado === "ACTIVO" && Boolean(proyecto.fechaFin),
  );
  const proyectoNotificacionSeleccionado = proyectosNotificacion.data?.find(
    (proyecto) => proyecto.id === Number(notificacionBorrador?.proyectoId),
  );
  const empleadosNotificacion =
    proyectoNotificacionSeleccionado?.empleados ?? [];
  const empleadosConUsuario = empleadosNotificacion.filter(
    (empleado) => empleado.tieneUsuarioActivo,
  );
  const destinatariosVacios =
    empleadosConUsuario.length === 0 ||
    (notificacionBorrador?.alcance === "SELECCIONADOS" &&
      notificacionBorrador.empleadoIds.length === 0);

  const proyectosFormulario = [...proyectosActivos];
  const tabs: [Pestana, typeof Bell, string][] = [
    ["bandeja", Bell, "Bandeja de alertas"],
  ];
  if (puedeConfigurar) {
    tabs.push(
      ["configuraciones", Settings2, "Reglas automáticas"],
      ["historial", History, "Historial"],
    );
  }
  const proyectoSeleccionado = proyectos.data?.find(
    (proyecto) => proyecto.id === Number(borrador?.proyectoId),
  );
  if (
    proyectoSeleccionado &&
    !proyectosFormulario.some(
      (proyecto) => proyecto.id === proyectoSeleccionado.id,
    )
  ) {
    proyectosFormulario.push(proyectoSeleccionado);
  }
  function abrirNueva() {
    setConfiguracionEditada(null);
    setBorrador(BORRADOR_VACIO);
    setErrorFormulario("");
  }
  function abrirNuevaNotificacion() {
    setNotificacionBorrador({
      proyectoId: "",
      nombre: "",
      descripcion: "",
      alcance: "TODOS",
      empleadoIds: [],
    });
    setErrorFormulario("");
  }
  function enviarNotificacion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!notificacionBorrador) return;
    const datos: DatosNotificacionAlerta = {
      proyectoId: Number(notificacionBorrador.proyectoId),
      nombre: notificacionBorrador.nombre.trim(),
      descripcion: notificacionBorrador.descripcion.trim(),
      todosAsignados: notificacionBorrador.alcance === "TODOS",
      empleadoIds: notificacionBorrador.empleadoIds.map(Number),
    };
    void crearNotificacion
      .mutateAsync(datos)
      .catch((error: unknown) => setErrorFormulario(mensajeError(error)));
  }
  function abrirEdicion(item: ConfiguracionAlerta) {
    setConfiguracionEditada(item);
    setBorrador({
      nombre: item.nombre,
      descripcion: item.descripcion ?? "",
      proyectoId: String(item.proyectoId),
      diasAntes: String(item.diasAntes),
      frecuencia: item.frecuencia,
      cadaNDias: String(item.cadaNDias ?? 2),
      diasEspecificos: item.diasEspecificos,
    });
    setErrorFormulario("");
  }
  function guardar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!borrador) return;
    const datos: DatosConfiguracionAlerta = {
      nombre: borrador.nombre.trim(),
      descripcion: borrador.descripcion.trim() || undefined,
      proyectoId: Number(borrador.proyectoId),
      diasAntes: Number(borrador.diasAntes),
      canal: "INTERNA",
      frecuencia: borrador.frecuencia,
      activa: configuracionEditada?.activa,
      ...(borrador.frecuencia === "CADA_N_DIAS"
        ? { cadaNDias: Number(borrador.cadaNDias) }
        : {}),
      ...(borrador.frecuencia === "DIAS_ESPECIFICOS"
        ? { diasEspecificos: borrador.diasEspecificos }
        : {}),
    };
    setErrorFormulario("");
    const mutation = configuracionEditada
      ? actualizar.mutateAsync({ id: configuracionEditada.id, datos })
      : crear.mutateAsync(datos);
    void mutation.catch((error: unknown) =>
      setErrorFormulario(mensajeError(error)),
    );
  }
  function borrarConfiguracion(item: ConfiguracionAlerta) {
    if (
      !window.confirm(
        `¿Eliminar la alerta “${item.nombre}”? La notificación generada y su auditoría se conservarán.`,
      )
    )
      return;
    eliminar.mutate(item.id);
  }
  function abrirNotificacion(item: NotificacionAlerta) {
    setNotificacionDetalle(item);
    if (item.esDestinatario && item.estado === "NUEVA") {
      visualizar.mutate(item.id);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-500">
            <Bell size={18} />
            <span className="text-sm font-medium">
              Seguimiento de proyectos
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Alertas</h1>
          <p className="mt-1 text-sm text-gray-600">
            Revisa avisos de tus proyectos y coordina lo que necesita atención.
          </p>
        </div>
        {puedeCrearNotificacion && (
          <Button onClick={abrirNuevaNotificacion}>
            <Plus size={17} /> Crear alerta para el equipo
          </Button>
        )}
        {pestana === "configuraciones" && puedeConfigurar && (
          <Button onClick={abrirNueva} variant="outline">
            <Plus size={17} /> Crear regla automática
          </Button>
        )}
      </header>

      <nav
        className="flex flex-wrap gap-2 border-b border-gray-200"
        aria-label="Secciones de alertas"
      >
        {tabs.map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => setPestana(key)}
            className={`flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium ${pestana === key ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-800"}`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </nav>

      {pestana === "bandeja" ? (
        <SeccionNotificaciones
          items={alertaItems}
          historial={false}
          loading={notificaciones.isPending}
          error={
            notificaciones.isError ? "No se pudieron cargar las alertas." : ""
          }
          onRetry={() => void notificaciones.refetch()}
          onOpen={abrirNotificacion}
          page={paginaNotificaciones}
          totalPages={notificaciones.data?.totalPages ?? 0}
          total={notificaciones.data?.total ?? 0}
          onPageChange={setPaginaNotificaciones}
        />
      ) : pestana === "historial" ? (
        <section className="space-y-4">
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Tipo de historial"
          >
            <button
              role="tab"
              aria-selected={subhistorial === "notificaciones"}
              onClick={() => setSubhistorial("notificaciones")}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${subhistorial === "notificaciones" ? "bg-gray-900 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"}`}
            >
              Generaciones de alertas
            </button>
            <button
              role="tab"
              aria-selected={subhistorial === "configuraciones"}
              onClick={() => setSubhistorial("configuraciones")}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${subhistorial === "configuraciones" ? "bg-gray-900 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"}`}
            >
              Cambios de configuración
            </button>
          </div>
          {subhistorial === "notificaciones" ? (
            <SeccionNotificaciones
              items={alertaItems}
              historial
              loading={notificaciones.isPending}
              error={
                notificaciones.isError ? "No se pudo cargar el historial." : ""
              }
              onRetry={() => void notificaciones.refetch()}
              onOpen={abrirNotificacion}
              page={paginaNotificaciones}
              totalPages={notificaciones.data?.totalPages ?? 0}
              total={notificaciones.data?.total ?? 0}
              onPageChange={setPaginaNotificaciones}
            />
          ) : (
            <SeccionAuditoria
              items={auditoriaGlobal.data ?? []}
              loading={auditoriaGlobal.isPending}
              error={
                auditoriaGlobal.isError ? "No se pudo cargar la auditoría." : ""
              }
              onRetry={() => void auditoriaGlobal.refetch()}
            />
          )}
        </section>
      ) : (
        <section className="space-y-4">
          {configuraciones.isError && (
            <ErrorPanel
              mensaje="No se pudieron cargar las configuraciones."
              reintentar={() => void configuraciones.refetch()}
            />
          )}
          {eliminar.isError && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {mensajeError(eliminar.error)}
            </p>
          )}
          {configuraciones.isPending ? (
            <p
              role="status"
              className="rounded-xl border bg-white p-6 text-gray-500"
            >
              Cargando configuraciones…
            </p>
          ) : configItems.length === 0 ? (
            <EmptyState
              icono={<Settings2 size={24} />}
              titulo="Aún no hay configuraciones"
              detalle="Aquí se administran las reglas automáticas ligadas a la fecha de finalización del proyecto."
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">
                    Configuraciones de alertas
                  </caption>
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      {[
                        "Alerta",
                        "Proyecto",
                        "Anticipación",
                        "Frecuencia",
                        "Estado",
                        "Acciones",
                      ].map((label) => (
                        <th key={label} className="px-4 py-3 font-semibold">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {configItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-gray-100 align-top"
                      >
                        <td className="px-4 py-4">
                          <p className="font-semibold text-gray-900">
                            {item.nombre}
                          </p>
                          <p className="mt-1 max-w-xs text-gray-500">
                            {item.descripcion || "Sin descripción"}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          {item.proyecto.nombre}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          {item.diasAntes} días antes
                        </td>
                        <td className="px-4 py-4">
                          {textoFrecuencia[item.frecuencia]}
                          {item.frecuencia === "CADA_N_DIAS"
                            ? ` · ${item.cadaNDias} días`
                            : item.frecuencia === "DIAS_ESPECIFICOS"
                              ? ` · ${item.diasEspecificos.map((d) => DIAS.find((itemDia) => itemDia.valor === d)?.etiqueta).join(", ")}`
                              : ""}
                        </td>
                        <td className="px-4 py-4">
                          <EstadoPill
                            activo={
                              item.activa && item.proyecto.estado === "ACTIVO"
                            }
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="font-medium text-blue-700 hover:underline"
                              onClick={() => setConfiguracionHistorial(item)}
                            >
                              Auditoría
                            </button>
                            {puedeEditar && (
                              <button
                                className="font-medium text-gray-700 hover:underline"
                                onClick={() => abrirEdicion(item)}
                              >
                                Editar
                              </button>
                            )}
                            {puedeEditar && (
                              <button
                                className="font-medium text-red-700 hover:underline"
                                onClick={() => borrarConfiguracion(item)}
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {notificacionBorrador && (
        <Dialogo
          titulo="Crear alerta para el equipo"
          onClose={() => setNotificacionBorrador(null)}
        >
          <form className="space-y-4" onSubmit={enviarNotificacion}>
            <Campo etiqueta="Proyecto" requerido>
              <select
                required
                value={notificacionBorrador.proyectoId}
                onChange={(event) =>
                  setNotificacionBorrador({
                    ...notificacionBorrador,
                    proyectoId: event.target.value,
                    alcance: "TODOS",
                    empleadoIds: [],
                  })
                }
                className={inputClass}
              >
                <option value="">Selecciona un proyecto</option>
                {(proyectosNotificacion.data ?? []).map((proyecto) => (
                  <option key={proyecto.id} value={proyecto.id}>
                    {proyecto.nombre}
                  </option>
                ))}
              </select>
              {!proyectosNotificacion.isPending &&
                proyectosNotificacion.data?.length === 0 && (
                  <p className="mt-1 text-xs text-amber-700">
                    No tienes proyectos activos asignados para crear alertas.
                  </p>
                )}
            </Campo>
            {proyectoNotificacionSeleccionado && (
              <fieldset className="space-y-3 rounded-lg border border-gray-200 p-4">
                <legend className="px-1 text-sm font-medium text-gray-800">
                  Destinatarios
                </legend>
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="alcance-alerta"
                    checked={notificacionBorrador.alcance === "TODOS"}
                    onChange={() =>
                      setNotificacionBorrador({
                        ...notificacionBorrador,
                        alcance: "TODOS",
                      })
                    }
                  />
                  <span>Todo el personal asignado con cuenta activa</span>
                </label>
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="alcance-alerta"
                    checked={notificacionBorrador.alcance === "SELECCIONADOS"}
                    onChange={() =>
                      setNotificacionBorrador({
                        ...notificacionBorrador,
                        alcance: "SELECCIONADOS",
                      })
                    }
                  />
                  <span>Elegir uno o varios empleados</span>
                </label>
                {notificacionBorrador.alcance === "SELECCIONADOS" && (
                  <div className="space-y-2 border-t border-gray-100 pt-3">
                    {empleadosNotificacion.length === 0 ? (
                      <p className="text-sm text-amber-700">
                        No hay empleados activos asignados a este proyecto.
                      </p>
                    ) : (
                      empleadosNotificacion.map((empleado) => (
                        <label
                          key={empleado.id}
                          className={`flex items-start gap-2 text-sm ${empleado.tieneUsuarioActivo ? "text-gray-700" : "text-gray-400"}`}
                        >
                          <input
                            type="checkbox"
                            disabled={!empleado.tieneUsuarioActivo}
                            checked={notificacionBorrador.empleadoIds.includes(
                              String(empleado.id),
                            )}
                            onChange={(event) =>
                              setNotificacionBorrador({
                                ...notificacionBorrador,
                                empleadoIds: event.target.checked
                                  ? [
                                    ...notificacionBorrador.empleadoIds,
                                    String(empleado.id),
                                  ]
                                  : notificacionBorrador.empleadoIds.filter(
                                    (id) => id !== String(empleado.id),
                                  ),
                              })
                            }
                          />
                          <span>
                            <span className="block font-medium">
                              {empleado.nombreCompleto}
                            </span>
                            {empleado.cargo && (
                              <span className="block text-xs text-gray-500">
                                {empleado.cargo}
                              </span>
                            )}
                            {!empleado.tieneUsuarioActivo && (
                              <span className="block text-xs text-amber-700">
                                Sin cuenta activa vinculada; no puede recibir
                                alertas
                              </span>
                            )}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
                {empleadosNotificacion.length > 0 &&
                  empleadosConUsuario.length === 0 && (
                    <p className="border-t border-gray-100 pt-3 text-sm text-amber-700">
                      Los empleados están asignados, pero ninguno tiene una
                      cuenta activa vinculada. En Usuarios, crea o vincula una
                      cuenta con cada empleado para poder enviarles alertas.
                    </p>
                  )}
              </fieldset>
            )}
            <Campo etiqueta="Título" requerido>
              <input
                autoFocus
                required
                minLength={2}
                maxLength={120}
                value={notificacionBorrador.nombre}
                onChange={(event) =>
                  setNotificacionBorrador({
                    ...notificacionBorrador,
                    nombre: event.target.value,
                  })
                }
                className={inputClass}
                placeholder="Ej. Faltan materiales para continuar"
              />
            </Campo>
            <Campo etiqueta="Detalle" requerido>
              <textarea
                required
                minLength={2}
                maxLength={2000}
                rows={4}
                value={notificacionBorrador.descripcion}
                onChange={(event) =>
                  setNotificacionBorrador({
                    ...notificacionBorrador,
                    descripcion: event.target.value,
                  })
                }
                className={inputClass}
                placeholder="Describe qué hace falta o qué debe revisar el técnico."
              />
            </Campo>
            <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
              Cada destinatario recibirá su propia notificación y podrá
              atenderla sin cambiar el estado de los demás.
            </p>
            {errorFormulario && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {errorFormulario}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => setNotificacionBorrador(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isDisabled={
                  crearNotificacion.isPending ||
                  proyectosNotificacion.isPending ||
                  !proyectosNotificacion.data?.length ||
                  destinatariosVacios
                }
              >
                {crearNotificacion.isPending ? "Enviando…" : "Enviar alerta"}
              </Button>
            </div>
          </form>
        </Dialogo>
      )}

      {borrador && (
        <Dialogo
          titulo={configuracionEditada ? "Editar alerta" : "Crear alerta"}
          onClose={() => setBorrador(null)}
        >
          <form className="space-y-4" onSubmit={guardar}>
            <Campo etiqueta="Nombre" requerido>
              <input
                autoFocus
                required
                maxLength={120}
                value={borrador.nombre}
                onChange={(event) =>
                  setBorrador({ ...borrador, nombre: event.target.value })
                }
                className={inputClass}
                placeholder="Ej. Próxima fecha de finalización"
              />
            </Campo>
            <Campo etiqueta="Descripción">
              <textarea
                maxLength={2000}
                rows={2}
                value={borrador.descripcion}
                onChange={(event) =>
                  setBorrador({ ...borrador, descripcion: event.target.value })
                }
                className={inputClass}
                placeholder="Describe qué debe revisar el equipo"
              />
            </Campo>
            <Campo etiqueta="Proyecto" requerido>
              <select
                required
                value={borrador.proyectoId}
                onChange={(event) =>
                  setBorrador({ ...borrador, proyectoId: event.target.value })
                }
                className={inputClass}
              >
                <option value="">Selecciona un proyecto activo</option>
                {proyectosFormulario.map((proyecto) => (
                  <option key={proyecto.id} value={proyecto.id}>
                    {proyecto.nombre}
                    {proyecto.estado !== "ACTIVO"
                      ? " · proyecto finalizado"
                      : ""}{" "}
                    · finaliza{" "}
                    {proyecto.fechaFin
                      ? new Intl.DateTimeFormat("es-SV", {
                        timeZone: "UTC",
                      }).format(new Date(proyecto.fechaFin))
                      : "sin fecha"}
                  </option>
                ))}
              </select>
              {proyectosActivos.length === 0 && (
                <p className="mt-1 text-xs text-amber-700">
                  No hay proyectos activos con fecha de finalización.
                </p>
              )}
            </Campo>
            {!configuracionEditada && (
              <Campo etiqueta="Plantilla de vencimiento">
                <div className="flex flex-wrap gap-2">
                  {PLANTILLAS_VENCIMIENTO.map((plantilla) => (
                    <Button
                      key={plantilla.dias}
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setBorrador({
                          ...borrador,
                          nombre: plantilla.nombre,
                          descripcion: plantilla.descripcion,
                          diasAntes: String(plantilla.dias),
                          frecuencia: "UNA_VEZ",
                        })
                      }
                    >
                      {plantilla.dias} días antes
                    </Button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  La regla avisará automáticamente a todo el personal activo
                  asignado cuando el proyecto entre en ese plazo.
                </p>
              </Campo>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Anticipación" requerido>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={3650}
                    required
                    value={borrador.diasAntes}
                    onChange={(event) =>
                      setBorrador({
                        ...borrador,
                        diasAntes: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                  <span className="shrink-0 text-sm text-gray-600">
                    días antes del fin
                  </span>
                </div>
              </Campo>
              <Campo etiqueta="Repetición" requerido>
                <select
                  value={borrador.frecuencia}
                  onChange={(event) =>
                    setBorrador({
                      ...borrador,
                      frecuencia: event.target.value as FrecuenciaAlerta,
                    })
                  }
                  className={inputClass}
                >
                  {Object.entries(textoFrecuencia).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>
            {borrador.frecuencia === "CADA_N_DIAS" && (
              <Campo etiqueta="Cada cuántos días" requerido>
                <input
                  type="number"
                  min={1}
                  max={365}
                  required
                  value={borrador.cadaNDias}
                  onChange={(event) =>
                    setBorrador({ ...borrador, cadaNDias: event.target.value })
                  }
                  className={inputClass}
                />
              </Campo>
            )}
            {borrador.frecuencia === "DIAS_ESPECIFICOS" && (
              <Campo etiqueta="Días de la semana" requerido>
                <div className="flex flex-wrap gap-2">
                  {DIAS.map((dia) => (
                    <label
                      key={dia.valor}
                      className={`flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-2 text-sm ${borrador.diasEspecificos.includes(dia.valor) ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700"}`}
                    >
                      <input
                        className="sr-only"
                        type="checkbox"
                        checked={borrador.diasEspecificos.includes(dia.valor)}
                        onChange={() =>
                          setBorrador({
                            ...borrador,
                            diasEspecificos: borrador.diasEspecificos.includes(
                              dia.valor,
                            )
                              ? borrador.diasEspecificos.filter(
                                (d) => d !== dia.valor,
                              )
                              : [...borrador.diasEspecificos, dia.valor],
                          })
                        }
                      />
                      {dia.etiqueta}
                    </label>
                  ))}
                </div>
                {borrador.diasEspecificos.length === 0 && (
                  <p className="mt-1 text-xs text-red-600">
                    Selecciona uno o más días.
                  </p>
                )}
              </Campo>
            )}
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
              <strong>Notificación interna.</strong> Falta el correo.
            </div>
            {configuracionEditada && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={configuracionEditada.activa}
                  onChange={(event) =>
                    setConfiguracionEditada({
                      ...configuracionEditada,
                      activa: event.target.checked,
                    })
                  }
                />
                Configuración activa
              </label>
            )}
            {errorFormulario && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {errorFormulario}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => setBorrador(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isDisabled={
                  crear.isPending ||
                  actualizar.isPending ||
                  (!configuracionEditada && proyectosActivos.length === 0)
                }
              >
                {crear.isPending || actualizar.isPending
                  ? "Guardando…"
                  : "Guardar alerta"}
              </Button>
            </div>
          </form>
        </Dialogo>
      )}

      {configuracionHistorial && (
        <Dialogo
          titulo={`Auditoría · ${configuracionHistorial.nombre}`}
          onClose={() => setConfiguracionHistorial(null)}
        >
          {auditoria.isPending ? (
            <p role="status" className="text-sm text-gray-500">
              Cargando auditoría…
            </p>
          ) : auditoria.isError ? (
            <ErrorPanel
              mensaje="No se pudo cargar la auditoría."
              reintentar={() => void auditoria.refetch()}
            />
          ) : (auditoria.data ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">
              No hay movimientos registrados.
            </p>
          ) : (
            <ol className="max-h-[65vh] space-y-3 overflow-y-auto">
              {(auditoria.data ?? []).map((item) => (
                <AuditoriaFila key={item.id} item={item} />
              ))}
            </ol>
          )}
        </Dialogo>
      )}

      {notificacionDetalle && (
        <Dialogo
          titulo={notificacionDetalle.nombreConfiguracion}
          onClose={() => setNotificacionDetalle(null)}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <EstadoNotificacion estado={notificacionDetalle.estado} />
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                Interna
              </span>
            </div>
            <dl className="grid gap-3 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Proyecto</dt>
                <dd className="mt-1 font-medium">
                  {notificacionDetalle.nombreProyecto}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Última generación</dt>
                <dd className="mt-1 font-medium">
                  {fechaHora(notificacionDetalle.ultimaGeneracion)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Fecha programada</dt>
                <dd className="mt-1 font-medium">
                  {new Intl.DateTimeFormat("es-SV", { timeZone: "UTC" }).format(
                    new Date(notificacionDetalle.ultimaFechaProgramada),
                  )}
                </dd>
              </div>
              {notificacionDetalle.visualizadaAt && (
                <div>
                  <dt className="text-gray-500">Visualizada</dt>
                  <dd className="mt-1 font-medium">
                    {fechaHora(notificacionDetalle.visualizadaAt)}
                  </dd>
                </div>
              )}
              {!notificacionDetalle.esDestinatario && (
                <div>
                  <dt className="text-gray-500">Destinatario</dt>
                  <dd className="mt-1 font-medium">
                    {notificacionDetalle.destinatario?.empleado
                      ?.nombreCompleto ??
                      `${notificacionDetalle.destinatario?.name ?? "Usuario"} ${notificacionDetalle.destinatario?.lastName ?? ""}`}
                  </dd>
                </div>
              )}
              {notificacionDetalle.esDestinatario &&
                notificacionDetalle.creadaPor && (
                  <div>
                    <dt className="text-gray-500">Enviada por</dt>
                    <dd className="mt-1 font-medium">
                      {notificacionDetalle.creadaPor.name}{" "}
                      {notificacionDetalle.creadaPor.lastName}
                    </dd>
                  </div>
                )}
              {notificacionDetalle.atendidaAt && (
                <div>
                  <dt className="text-gray-500">Atendida</dt>
                  <dd className="mt-1 font-medium">
                    {fechaHora(notificacionDetalle.atendidaAt)}
                  </dd>
                </div>
              )}
            </dl>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                Descripción
              </h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                {notificacionDetalle.descripcion ||
                  "La fecha de finalización del proyecto se encuentra dentro del plazo configurado."}
              </p>
            </div>
            {visualizar.isError && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {mensajeError(visualizar.error)}
              </p>
            )}
            {atender.isError && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {mensajeError(atender.error)}
              </p>
            )}
            {notificacionDetalle.esDestinatario &&
              notificacionDetalle.estado !== "ATENDIDA" && (
                <div className="flex justify-end border-t border-gray-100 pt-4">
                  <Button
                    onClick={() => atender.mutate(notificacionDetalle.id)}
                    isDisabled={atender.isPending}
                  >
                    {atender.isPending ? "Guardando…" : "Marcar como atendida"}
                  </Button>
                </div>
              )}
          </div>
        </Dialogo>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-700 focus:ring-2 focus:ring-gray-100";
function Campo({
  etiqueta,
  requerido,
  children,
}: {
  etiqueta: string;
  requerido?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-medium text-gray-800">
      {etiqueta}
      {requerido && <span className="ml-1 text-red-600">*</span>}
      {children}
    </label>
  );
}
function SeccionNotificaciones({
  items,
  historial,
  loading,
  error,
  onRetry,
  onOpen,
  page,
  totalPages,
  total,
  onPageChange,
}: {
  items: NotificacionAlerta[];
  historial: boolean;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onOpen: (item: NotificacionAlerta) => void;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const visibles = items;
  if (loading)
    return (
      <p role="status" className="rounded-xl border bg-white p-6 text-gray-500">
        Cargando alertas…
      </p>
    );
  if (error) return <ErrorPanel mensaje={error} reintentar={onRetry} />;
  if (!visibles.length)
    return (
      <EmptyState
        icono={historial ? <History size={24} /> : <Bell size={24} />}
        titulo={historial ? "Sin alertas en el historial" : "Todo al día"}
        detalle={
          historial
            ? "Las alertas generadas aparecerán aquí."
            : "No hay alertas pendientes por revisar."
        }
      />
    );
  return (
    <div className="space-y-3">
      {visibles.map((item) => (
        <article
          key={item.id}
          className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <EstadoNotificacion estado={item.estado} />
              <span className="text-xs text-gray-500">
                {fechaHora(item.ultimaGeneracion)}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {item.esDestinatario
                ? `De: ${item.creadaPor ? `${item.creadaPor.name} ${item.creadaPor.lastName}` : "Sistema"}`
                : `Para: ${item.destinatario?.empleado?.nombreCompleto ?? `${item.destinatario?.name ?? "Usuario"} ${item.destinatario?.lastName ?? ""}`}`}
            </p>
            <h2 className="mt-2 font-semibold text-gray-900">
              {item.nombreConfiguracion}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {item.nombreProyecto} · programada para{" "}
              {new Intl.DateTimeFormat("es-SV", { timeZone: "UTC" }).format(
                new Date(item.ultimaFechaProgramada),
              )}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
              {item.descripcion ||
                "Aviso de seguimiento de la fecha de finalización del proyecto."}
            </p>
          </div>
          <button
            className="shrink-0 self-start rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 sm:self-auto"
            onClick={() => onOpen(item)}
          >
            Ver detalle
          </button>
        </article>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 text-sm text-gray-600">
        <span>
          {total === 0
            ? "Sin alertas"
            : `Mostrando ${(page - 1) * 10 + 1}–${Math.min(page * 10, total)} de ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-gray-300 p-2 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Página anterior"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            Página {page} de {Math.max(totalPages, 1)}
          </span>
          <button
            type="button"
            className="rounded-lg border border-gray-300 p-2 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Página siguiente"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
function EstadoNotificacion({
  estado,
}: {
  estado: NotificacionAlerta["estado"];
}) {
  const estilo =
    estado === "NUEVA"
      ? "bg-amber-100 text-amber-800"
      : estado === "VISUALIZADA"
        ? "bg-blue-100 text-blue-800"
        : "bg-emerald-100 text-emerald-800";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estilo}`}
    >
      {nombreEstado(estado)}
    </span>
  );
}
function EstadoPill({ activo }: { activo: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${activo ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}
    >
      {activo ? "Activa" : "Inactiva"}
    </span>
  );
}
function EmptyState({
  icono,
  titulo,
  detalle,
}: {
  icono: React.ReactNode;
  titulo: string;
  detalle: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-600">
        {icono}
      </div>
      <h2 className="mt-4 font-semibold text-gray-900">{titulo}</h2>
      <p className="mt-1 text-sm text-gray-500">{detalle}</p>
    </div>
  );
}
function ErrorPanel({
  mensaje,
  reintentar,
}: {
  mensaje: string;
  reintentar: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      {mensaje}
      <button className="ml-2 font-semibold underline" onClick={reintentar}>
        Reintentar
      </button>
    </div>
  );
}
function Dialogo({
  titulo,
  onClose,
  children,
}: {
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900">{titulo}</h2>
          <button
            aria-label="Cerrar"
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
function SeccionAuditoria({
  items,
  loading,
  error,
  onRetry,
}: {
  items: AuditoriaAlerta[];
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  if (loading)
    return (
      <p role="status" className="rounded-xl border bg-white p-6 text-gray-500">
        Cargando auditoría…
      </p>
    );
  if (error) return <ErrorPanel mensaje={error} reintentar={onRetry} />;
  if (!items.length)
    return (
      <EmptyState
        icono={<History size={24} />}
        titulo="Sin cambios registrados"
        detalle="Las creaciones, ediciones y eliminaciones aparecerán aquí."
      />
    );
  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <AuditoriaFila key={item.id} item={item} />
      ))}
    </ol>
  );
}
function AuditoriaFila({ item }: { item: AuditoriaAlerta }) {
  let datos: unknown = item.datos;
  try {
    datos = JSON.parse(item.datos);
  } catch {
    /* Conserva el texto de auditoría */
  }
  const datosObjeto =
    typeof datos === "object" && datos !== null
      ? (datos as Record<string, unknown>)
      : {};
  const notificacionManual = datosObjeto.tipo === "NOTIFICACION_MANUAL";
  const descripcion = notificacionManual
    ? "Alerta enviada al equipo"
    : item.accion === "CREADA"
      ? "Configuración creada"
      : item.accion === "EDITADA"
        ? "Configuración editada"
        : "Configuración eliminada";
  return (
    <li className="rounded-lg border border-gray-200 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="text-sm">{descripcion}</strong>
        <time className="text-xs text-gray-500">
          {fechaHora(item.createdAt)}
        </time>
      </div>
      <p className="mt-1 text-xs text-gray-600">
        {notificacionManual
          ? `${String(datosObjeto.nombre ?? "Alerta manual")} · ${String(datosObjeto.nombreProyecto ?? "Proyecto")}`
          : item.configuracion
            ? `${item.configuracion.nombre} · ${item.configuracion.proyecto.nombre}`
            : `Configuración #${item.configuracionId ?? "eliminada"}`}{" "}
        ·{" "}
        {item.usuario
          ? `${item.usuario.name} ${item.usuario.lastName}`
          : "Usuario ya no disponible"}
      </p>
      <details className="mt-2">
        <summary className="cursor-pointer text-xs font-medium text-blue-700">
          Ver cambios registrados
        </summary>
        <pre className="mt-2 max-h-56 overflow-auto rounded bg-gray-50 p-2 text-xs whitespace-pre-wrap">
          {JSON.stringify(datos, null, 2)}
        </pre>
      </details>
    </li>
  );
}
