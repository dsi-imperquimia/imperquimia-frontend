import { Button } from "@heroui/react/button";
import {
  errorActividadDiaria,
  exportarActividadesDiarias,
  listActividadesDiarias,
  listProyectosDisponiblesActividad,
} from "@modules/actividades-diarias/api/actividades-diarias";
import { BorradoresActividad } from "@modules/actividades-diarias/components/BorradoresActividad";
import { ModalResultadoActividad } from "@modules/actividades-diarias/components/ModalResultadoActividad";
import { SelectorProyectoActividad } from "@modules/actividades-diarias/components/SelectorProyectoActividad";
import { TablaActividadesProyecto } from "@modules/actividades-diarias/components/TablaActividadesProyecto";
import { useBorradoresActividad } from "@modules/actividades-diarias/hooks/useBorradoresActividad";
import {
  fechaHoyIso,
  restarDiasIso,
  type FormatoExportacionActividad,
} from "@modules/actividades-diarias/types/actividad-diaria";
import { useAuth } from "@modules/auth/store/authStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/actividades-diarias/")({
  component: ActividadesDiariasPage,
});

export function ActividadesDiariasPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasPermission, hasAnyPermission } = useAuth();
  const [selectedProyectoId, setSelectedProyectoId] = useState<number | null>(
    null,
  );
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [exportandoFormato, setExportandoFormato] =
    useState<FormatoExportacionActividad | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const hoyIso = fechaHoyIso();
  const inicioUltimaSemana = restarDiasIso(7, hoyIso);
  const rangoInvalido = Boolean(
    fechaInicio && fechaFin && fechaInicio > fechaFin,
  );
  const esUltimaSemanaActiva =
    fechaInicio === inicioUltimaSemana && fechaFin === hoyIso;
  const hayFiltrosActivos =
    selectedProyectoId !== null || Boolean(fechaInicio) || Boolean(fechaFin);

  const puedeCrear = hasPermission("ACTIVIDAD_CREATE");
  const puedeEditar = hasAnyPermission([
    "ACTIVIDAD_UPDATE",
    "ACTIVIDAD_CREATE",
  ]);
  const {
    borradores,
    claveEnProceso,
    isReenviandoTodos,
    reenviar,
    descartar,
    estadoModal,
    cerrarModal,
  } = useBorradoresActividad({ autoSync: puedeCrear });

  const proyectosQuery = useQuery({
    queryKey: ["actividades-diarias", "proyectos-disponibles"],
    queryFn: listProyectosDisponiblesActividad,
  });

  const actividadesQuery = useQuery({
    queryKey: [
      "actividades-diarias",
      "lista",
      selectedProyectoId,
      fechaInicio,
      fechaFin,
    ],
    queryFn: () =>
      listActividadesDiarias(
        fechaInicio || fechaFin
          ? {
              proyectoId: selectedProyectoId,
              fechaInicio: fechaInicio || undefined,
              fechaFin: fechaFin || undefined,
            }
          : selectedProyectoId,
      ),
    enabled: !rangoInvalido,
  });

  const actividades = rangoInvalido ? [] : (actividadesQuery.data ?? []);

  const proyectos = useMemo(
    () =>
      (proyectosQuery.data ?? []).filter((item) => item.estado === "ACTIVO"),
    [proyectosQuery.data],
  );

  const handleSelectProyecto = useCallback((proyectoId: number | null) => {
    setSelectedProyectoId(proyectoId);
  }, []);

  function aplicarUltimaSemana() {
    setExportError(null);
    if (esUltimaSemanaActiva) {
      setFechaInicio("");
      setFechaFin("");
      return;
    }
    setFechaInicio(inicioUltimaSemana);
    setFechaFin(hoyIso);
  }

  function limpiarFiltros() {
    setExportError(null);
    setSelectedProyectoId(null);
    setFechaInicio("");
    setFechaFin("");
  }

  async function handleExportar(formato: FormatoExportacionActividad) {
    if (rangoInvalido || exportandoFormato !== null) return;
    setExportError(null);
    setExportandoFormato(formato);
    try {
      const { blob, filename } = await exportarActividadesDiarias(formato, {
        proyectoId: selectedProyectoId,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
      });
      const objectUrl = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = objectUrl;
      enlace.download = filename;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setExportError(
        errorActividadDiaria(error).general ??
          "No se pudo exportar el reporte de actividades.",
      );
    } finally {
      setExportandoFormato(null);
    }
  }

  async function refrescarTodo() {
    await queryClient.invalidateQueries({
      queryKey: ["actividades-diarias"],
    });
  }

  const isRefreshing = proyectosQuery.isFetching || actividadesQuery.isFetching;
  const exportDeshabilitado =
    rangoInvalido ||
    actividadesQuery.isPending ||
    actividadesQuery.isError ||
    actividades.length === 0 ||
    exportandoFormato !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Actividades diarias</h1>
          <p className="text-sm text-gray-500">
            Consulta las jornadas registradas, fíltralas por proyecto o rango de
            fechas y expórtalas a PDF o Excel.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleExportar("pdf")}
            isDisabled={exportDeshabilitado}
          >
            {exportandoFormato === "pdf" ? "Exportando PDF..." : "Exportar PDF"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleExportar("excel")}
            isDisabled={exportDeshabilitado}
          >
            {exportandoFormato === "excel"
              ? "Exportando Excel..."
              : "Exportar Excel"}
          </Button>
          <Button
            variant="outline"
            onClick={() => void refrescarTodo()}
            isDisabled={isRefreshing}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {puedeCrear && (
        <Link
          to="/actividades-diarias/create"
          className="inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
        >
          Crear actividad diaria
        </Link>
      )}

      {puedeCrear && (
        <BorradoresActividad
          borradores={borradores}
          claveEnProceso={claveEnProceso}
          isReenviandoTodos={isReenviandoTodos}
          onReenviar={reenviar}
          onDescartar={descartar}
        />
      )}

      {/* GPRCIMPER-29 / GPRIMPER-43: Filtros por proyecto y rango de fechas */}
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-60 flex-1">
            <SelectorProyectoActividad
              proyectos={proyectos}
              selectedProyectoId={selectedProyectoId}
              onSelectProyecto={handleSelectProyecto}
              autoSelectSingle={false}
              label="Filtrar por proyecto"
              placeholder="Todos los proyectos (escribe para buscar)"
              description=""
            />
          </div>
          <label className="flex min-w-40 flex-col gap-1 text-sm font-medium text-gray-700">
            <span>Fecha inicio</span>
            <input
              type="date"
              aria-label="Fecha inicio"
              value={fechaInicio}
              max={fechaFin || undefined}
              onChange={(e) => {
                setExportError(null);
                setFechaInicio(e.target.value);
              }}
              className="rounded-lg border border-gray-300 p-2 text-sm font-normal text-gray-900"
            />
          </label>
          <label className="flex min-w-40 flex-col gap-1 text-sm font-medium text-gray-700">
            <span>Fecha fin</span>
            <input
              type="date"
              aria-label="Fecha fin"
              value={fechaFin}
              min={fechaInicio || undefined}
              onChange={(e) => {
                setExportError(null);
                setFechaFin(e.target.value);
              }}
              className="rounded-lg border border-gray-300 p-2 text-sm font-normal text-gray-900"
            />
          </label>
          <Button
            type="button"
            variant={esUltimaSemanaActiva ? "primary" : "outline"}
            aria-pressed={esUltimaSemanaActiva}
            onClick={aplicarUltimaSemana}
          >
            Última semana
          </Button>
          {hayFiltrosActivos && (
            <Button type="button" variant="outline" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          )}
        </div>
        {rangoInvalido && (
          <p role="alert" className="text-sm text-red-700">
            La fecha de inicio no puede ser mayor que la fecha fin.
          </p>
        )}
        {exportError && (
          <p role="alert" className="text-sm text-red-700">
            {exportError}
          </p>
        )}
        {proyectosQuery.isError && (
          <p role="alert" className="text-sm text-red-700">
            No se pudieron cargar tus proyectos asignados.{" "}
            <button
              type="button"
              onClick={() => void proyectosQuery.refetch()}
              className="font-medium underline"
            >
              Reintentar
            </button>
          </p>
        )}
      </div>

      {!proyectosQuery.isPending &&
        !proyectosQuery.isError &&
        proyectos.length === 0 && (
          <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
            Todavía no tienes proyectos activos asignados como Jefe de Proyecto.
          </p>
        )}

      {/* GPRCIMPER-34: Lista única de actividades diarias */}
      {!rangoInvalido && (
        <TablaActividadesProyecto
          actividades={actividades}
          isPending={actividadesQuery.isPending}
          isError={actividadesQuery.isError}
          onRetry={() => void actividadesQuery.refetch()}
          onEditar={
            puedeEditar
              ? (actividad) =>
                  void navigate({
                    to: "/actividades-diarias/editar/$actividadId",
                    params: { actividadId: String(actividad.id) },
                  })
              : undefined
          }
        />
      )}

      <ModalResultadoActividad estado={estadoModal} onClose={cerrarModal} />
    </div>
  );
}
