import { DatePickerField } from "@components/fields/DatePickerField";
import { InputField } from "@components/fields/InputField";
import { SelectedField } from "@components/fields/SelectedField";
import { TextAreaField } from "@components/fields/TextAreaField";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { ListBox } from "@heroui/react/list-box";
import { listActividadesDiarias } from "@modules/actividades-diarias/api/actividades-diarias";
import { SelectorProyectoActividad } from "@modules/actividades-diarias/components/SelectorProyectoActividad";
import { nuevaClaveOperacion } from "@lib/uuid";
import { fecha as formatearFecha } from "@modules/proyectos/types/proyectos";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  actualizarIncidencia,
  errorIncidencia,
  listProyectosDisponiblesIncidencia,
  registrarIncidencia,
} from "../api/incidencias";
import {
  ETIQUETA_PRIORIDAD,
  PRIORIDADES,
  fechaHoyIso,
  type ErroresIncidencia,
  type Incidencia,
  type PrioridadIncidencia,
} from "../types/incidencia";

/** Reporte de jornada desde el que se registra la incidencia (GPRCIMPER-142). */
export interface JornadaOrigenIncidencia {
  id: number;
  proyectoId: number;
  proyectoNombre?: string;
  /** Fecha de la jornada (AAAA-MM-DD o ISO); se usa como fecha inicial. */
  fecha: string;
}

/**
 * GPRCIMPER-141: registra una incidencia (sin `incidencia`) o edita sus datos
 * básicos y prioridad (con `incidencia`). El estado se gestiona aparte.
 *
 * GPRCIMPER-142: con `jornada` la incidencia se registra ya vinculada a ese
 * reporte diario (proyecto fijo) y, al terminar, llama a `onSuccess` en vez
 * de navegar al detalle.
 */
export function FormIncidencia({
  incidencia,
  proyectoIdInicial,
  jornada,
  onSuccess,
  onCancel,
  embebido = false,
}: {
  incidencia?: Incidencia;
  proyectoIdInicial?: number | null;
  jornada?: JornadaOrigenIncidencia;
  onSuccess?: (incidencia: Incidencia) => void;
  onCancel?: () => void;
  /** Sin tarjeta contenedora (para usarlo dentro de un modal). */
  embebido?: boolean;
}) {
  const esEdicion = Boolean(incidencia);
  const proyectoFijo = Boolean(incidencia || jornada);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [proyectoId, setProyectoId] = useState<number | null>(
    incidencia?.proyectoId ?? jornada?.proyectoId ?? proyectoIdInicial ?? null,
  );
  const [titulo, setTitulo] = useState(incidencia?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(incidencia?.descripcion ?? "");
  const [fecha, setFecha] = useState(
    incidencia
      ? incidencia.fecha.slice(0, 10)
      : jornada
        ? jornada.fecha.slice(0, 10)
        : fechaHoyIso(),
  );
  const [prioridad, setPrioridad] = useState<PrioridadIncidencia>(
    incidencia?.prioridad ?? "MEDIA",
  );
  // Registro independiente: la actividad diaria es opcional.
  const puedeElegirActividad = !proyectoFijo;
  const [actividadId, setActividadId] = useState<number | null>(null);
  const [claveOperacion] = useState(nuevaClaveOperacion);
  const [isPending, setIsPending] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [errores, setErrores] = useState<ErroresIncidencia>({ campos: {} });

  const proyectosQuery = useQuery({
    queryKey: ["incidencias", "proyectos-disponibles"],
    queryFn: listProyectosDisponiblesIncidencia,
    enabled: !proyectoFijo,
  });

  const actividadesQuery = useQuery({
    queryKey: ["actividades-diarias", "lista", { proyectoId }],
    queryFn: () => listActividadesDiarias({ proyectoId }),
    enabled: puedeElegirActividad && proyectoId !== null,
  });
  const actividades = actividadesQuery.data ?? [];

  function limpiarCampo(campo: keyof ErroresIncidencia["campos"]) {
    setErrores((prev) => ({
      ...prev,
      campos: { ...prev.campos, [campo]: undefined },
    }));
  }

  function validar(): boolean {
    const campos: ErroresIncidencia["campos"] = {};
    if (!proyectoFijo && !proyectoId) {
      campos.proyectoId = "Selecciona un proyecto válido.";
    }
    if (!titulo.trim()) campos.titulo = "Ingresa el título de la incidencia.";
    else if (titulo.trim().length > 150) {
      campos.titulo = "El título admite hasta 150 caracteres.";
    }
    if (!descripcion.trim()) {
      campos.descripcion = "Ingresa la descripción de la incidencia.";
    }
    if (!fecha.trim()) {
      campos.fecha = "Ingresa una fecha válida en formato AAAA-MM-DD.";
    } else if (fecha.trim() > fechaHoyIso()) {
      campos.fecha = "La fecha no puede ser futura.";
    }
    setErrores({ campos });
    return Object.keys(campos).length === 0;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setGuardado(false);
    if (!validar()) return;

    setIsPending(true);
    try {
      if (incidencia) {
        await actualizarIncidencia(incidencia.id, {
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          fecha: fecha.trim(),
          prioridad,
        });
        await queryClient.invalidateQueries({ queryKey: ["incidencias"] });
        setGuardado(true);
      } else if (proyectoId) {
        const { incidencia: creada } = await registrarIncidencia({
          claveOperacion,
          proyectoId,
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          fecha: fecha.trim(),
          prioridad,
          actividadDiariaId: jornada?.id ?? actividadId ?? undefined,
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["incidencias"] }),
          queryClient.invalidateQueries({
            queryKey: ["actividades-diarias"],
          }),
        ]);
        if (jornada) {
          onSuccess?.(creada);
          return;
        }
        await navigate({
          to: "/incidencias/$incidenciaId",
          params: { incidenciaId: String(creada.id) },
        });
      }
    } catch (error) {
      setErrores(errorIncidencia(error));
    } finally {
      setIsPending(false);
    }
  }

  const formulario = (
    <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
      {proyectoFijo ? (
        <p className="text-sm text-gray-600">
          Proyecto:{" "}
          <span className="font-medium text-gray-900">
            {incidencia?.proyecto?.nombre ??
              jornada?.proyectoNombre ??
              `#${incidencia?.proyectoId ?? jornada?.proyectoId}`}
          </span>
        </p>
      ) : (
        <>
          {proyectosQuery.isError && (
            <p role="alert" className="text-sm text-red-700">
              No se pudieron cargar los proyectos disponibles.
            </p>
          )}
          <SelectorProyectoActividad
            proyectos={proyectosQuery.data ?? []}
            selectedProyectoId={proyectoId}
            onSelectProyecto={(id) => {
              if (id !== proyectoId) setActividadId(null);
              setProyectoId(id);
              limpiarCampo("proyectoId");
              limpiarCampo("actividadDiariaId");
            }}
            errorMessage={errores.campos.proyectoId}
            isDisabled={isPending}
            isRequired
          />
          {proyectoId !== null && (
            <>
              <SelectedField
                label="Actividad diaria (opcional)"
                placeholder={
                  actividadesQuery.isPending
                    ? "Cargando actividades…"
                    : "Sin actividad vinculada"
                }
                selectedKey={actividadId === null ? null : String(actividadId)}
                isDisabled={
                  isPending ||
                  actividadesQuery.isPending ||
                  actividades.length === 0
                }
                errorMessage={errores.campos.actividadDiariaId}
                onSelectionChange={(key) => {
                  const id = key ? Number(key) : null;
                  setActividadId(id);
                  limpiarCampo("actividadDiariaId");
                  const elegida = actividades.find((a) => a.id === id);
                  // La incidencia ocurrió en la jornada: se propone su fecha.
                  if (elegida) setFecha(elegida.fecha.slice(0, 10));
                }}
              >
                <ListBox.Item id="" textValue="Sin actividad vinculada">
                  Sin actividad vinculada
                </ListBox.Item>
                {actividades.map((a) => (
                  <ListBox.Item
                    key={a.id}
                    id={String(a.id)}
                    textValue={`${formatearFecha(a.fecha)} ${a.nombre}`}
                  >
                    {formatearFecha(a.fecha)} · {a.nombre}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </SelectedField>
              {actividadesQuery.isError && (
                <p role="alert" className="text-sm text-red-700">
                  No se pudieron cargar las actividades del proyecto.
                </p>
              )}
              {actividadesQuery.isSuccess && actividades.length === 0 && (
                <p className="text-sm text-gray-500">
                  Este proyecto no tiene actividades diarias; la incidencia se
                  registrará sin vincular.
                </p>
              )}
            </>
          )}
        </>
      )}

      <InputField
        label="Título"
        placeholder="Ej. Filtración en losa del segundo nivel"
        maxLength={150}
        value={titulo}
        disabled={isPending}
        onChange={(e) => {
          setTitulo(e.target.value);
          limpiarCampo("titulo");
        }}
        errorMessage={errores.campos.titulo}
        isRequired
      />

      <TextAreaField
        label="Descripción"
        placeholder="Describe qué ocurrió y dónde"
        rows={4}
        value={descripcion}
        disabled={isPending}
        onChange={(e) => {
          setDescripcion(e.target.value);
          limpiarCampo("descripcion");
        }}
        errorMessage={errores.campos.descripcion}
        isRequired
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <DatePickerField
          label="Fecha de la incidencia"
          max={fechaHoyIso()}
          value={fecha}
          isDisabled={isPending}
          onChange={(valor) => {
            setFecha(valor);
            limpiarCampo("fecha");
          }}
          errorMessage={errores.campos.fecha}
          isRequired
        />
        <SelectedField
          label="Prioridad"
          placeholder="Selecciona una prioridad"
          selectedKey={prioridad}
          isDisabled={isPending}
          onSelectionChange={(key) => {
            if (key) setPrioridad(String(key) as PrioridadIncidencia);
          }}
        >
          {PRIORIDADES.map((p) => (
            <ListBox.Item key={p} id={p} textValue={ETIQUETA_PRIORIDAD[p]}>
              {ETIQUETA_PRIORIDAD[p]}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </SelectedField>
      </div>

      {errores.general && Object.keys(errores.campos).length === 0 && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {errores.general}
        </p>
      )}
      {guardado && (
        <p
          role="status"
          className="rounded-lg bg-green-50 p-3 text-sm text-green-800"
        >
          Cambios guardados.
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" isPending={isPending} isDisabled={isPending}>
          {esEdicion ? "Guardar cambios" : "Registrar incidencia"}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            isDisabled={isPending}
            onClick={onCancel}
          >
            Cancelar
          </Button>
        ) : (
          <Link to="/incidencias">
            <Button type="button" variant="outline" isDisabled={isPending}>
              {esEdicion ? "Volver" : "Cancelar"}
            </Button>
          </Link>
        )}
      </div>
    </form>
  );

  if (embebido) return formulario;
  return (
    <Card>
      <Card.Content>{formulario}</Card.Content>
    </Card>
  );
}
