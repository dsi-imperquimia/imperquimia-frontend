import { DatePickerField } from "@components/fields/DatePickerField";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import {
  errorActividadDiaria,
  exportarActividadesDiarias,
  listActividadesDiarias,
  listProyectosDisponiblesActividad,
} from "@modules/actividades-diarias/api/actividades-diarias";
import { BorradoresActividad } from "@modules/actividades-diarias/components/BorradoresActividad";
import { ModalResultadoActividad } from "@modules/actividades-diarias/components/ModalResultadoActividad";
import { ModalEvidenciasActividad } from "@modules/actividades-diarias/components/PanelEvidenciasActividad";
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
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";

export function ActividadesDiariasPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasPermission, hasAnyPermission } = useAuth();
  const [selectedProyectoId, setSelectedProyectoId] = useState<number | null>(
    null,
  );
  const [resetProyectoSignal, setResetProyectoSignal] = useState(0);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [exportandoFormato, setExportandoFormato] =
    useState<FormatoExportacionActividad | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [actividadEvidenciasId, setActividadEvidenciasId] = useState<
    number | null
  >(null);

  const hoyIso = fechaHoyIso();
  const inicioUltimaSemana = restarDiasIso(7, hoyIso);
  const rangoInvalido = Boolean(
    fechaInicio && fechaFin && fechaInicio > fechaFin,
  );
  const esUltimaSemanaActiva =
    fechaInicio === inicioUltimaSemana && fechaFin === hoyIso;

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

  const proyectos = useMemo(
    () =>
      (proyectosQuery.data ?? []).filter((item) => item.estado === "ACTIVO"),
    [proyectosQuery.data],
  );
  const proyectoSeleccionado = useMemo(
    () =>
      selectedProyectoId !== null
        ? (proyectos.find((item) => item.id === selectedProyectoId) ?? null)
        : null,
    [proyectos, selectedProyectoId],
  );
  const hayFiltrosActivos =
    (proyectos.length > 1 && selectedProyectoId !== null) ||
    Boolean(fechaInicio) ||
    Boolean(fechaFin);

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
  const actividadEvidencias =
    actividades.find((item) => item.id === actividadEvidenciasId) ?? null;

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
    if (proyectos.length > 1) {
      setSelectedProyectoId(null);
    }
    setResetProyectoSignal((prev) => prev + 1);
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
          <h1 className="text-2xl font-bold">
            Bitácora de actividades diarias
          </h1>
          <p className="text-sm text-gray-500">
            El sistema genera el registro diario por proyecto activo. Selecciona
            tu proyecto para guardar el avance del día, editar registros dentro
            de las 48 h, filtrar por fechas, exportar a PDF/Excel y adjuntar
            evidencia fotográfica.
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
        <BorradoresActividad
          borradores={borradores}
          claveEnProceso={claveEnProceso}
          isReenviandoTodos={isReenviandoTodos}
          onReenviar={reenviar}
          onDescartar={descartar}
        />
      )}

      {/* GPRCIMPER-29 / GPRIMPER-43: Filtros por proyecto y rango de fechas */}
      <Card className="gap-3">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-60 flex-1">
            <SelectorProyectoActividad
              proyectos={proyectos}
              selectedProyectoId={selectedProyectoId}
              onSelectProyecto={handleSelectProyecto}
              autoSelectSingle={true}
              resetSignal={resetProyectoSignal}
              label="Filtrar por proyecto"
              placeholder="Todos los proyectos (escribe para buscar)"
              description=""
            />
          </div>
          <DatePickerField
            className="min-w-40"
            label="Fecha inicio"
            value={fechaInicio}
            max={fechaFin || undefined}
            onChange={(valor) => {
              setExportError(null);
              setFechaInicio(valor);
            }}
          />
          <DatePickerField
            className="min-w-40"
            label="Fecha fin"
            value={fechaFin}
            min={fechaInicio || undefined}
            onChange={(valor) => {
              setExportError(null);
              setFechaFin(valor);
            }}
          />
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
      </Card>

      {!proyectosQuery.isPending &&
        !proyectosQuery.isError &&
        proyectos.length === 0 && (
          <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
            Todavía no tienes proyectos activos asignados como Jefe de Proyecto.
          </p>
        )}

      {proyectoSeleccionado && (
        <div
          aria-label="Proyecto seleccionado en bitácora"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
        >
          <div className="flex flex-wrap items-center gap-2 text-gray-700">
            <span className="font-semibold text-gray-900">
              {proyectoSeleccionado.nombre}
            </span>
            {proyectoSeleccionado.ubicacion && (
              <span>· {proyectoSeleccionado.ubicacion}</span>
            )}
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
              {proyectoSeleccionado.estado}
            </span>
            <span className="text-gray-500">
              · {actividades.length} registro(s)
            </span>
          </div>
          {proyectos.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedProyectoId(null)}
            >
              Ver todos los proyectos
            </Button>
          )}
        </div>
      )}

      {/* GPRCIMPER-34: Lista única de actividades diarias */}
      {!rangoInvalido && (
        <TablaActividadesProyecto
          actividades={actividades}
          isPending={actividadesQuery.isPending}
          isError={actividadesQuery.isError}
          onRetry={() => void actividadesQuery.refetch()}
          onEvidencias={(actividad) => setActividadEvidenciasId(actividad.id)}
          onEditar={
            puedeEditar || puedeCrear
              ? (actividad) =>
                  void navigate({
                    to: "/actividades-diarias/editar/$actividadId",
                    params: { actividadId: String(actividad.id) },
                  })
              : undefined
          }
        />
      )}

      <ModalEvidenciasActividad
        actividad={actividadEvidencias}
        soloLectura={!puedeEditar}
        onClose={() => setActividadEvidenciasId(null)}
      />

      <ModalResultadoActividad estado={estadoModal} onClose={cerrarModal} />
    </div>
  );
}
