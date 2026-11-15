import { InputField } from "@components/fields/InputField";
import { TextAreaField } from "@components/fields/TextAreaField";
import { AlertDialog } from "@heroui/react/alert-dialog";
import { Button } from "@heroui/react/button";
import { useAuth } from "@modules/auth/store/authStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  actualizarActividadDiaria,
  errorActividadDiaria,
  esErrorDeConexion,
  listProyectosDisponiblesActividad,
  registrarActividadDiaria,
} from "../api/actividades-diarias";
import { useBorradoresActividad } from "../hooks/useBorradoresActividad";
import {
  fechaHoyIso,
  puedeEditarActividad,
  type ActividadDiaria,
  type ErroresActividadDiaria,
  type ProyectoDisponibleActividad,
} from "../types/actividad-diaria";
import { BorradoresActividad } from "./BorradoresActividad";
import { ModalResultadoActividad } from "./ModalResultadoActividad";
import { SelectorProyectoActividad } from "./SelectorProyectoActividad";

function nuevaClaveOperacion(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  return "00000000-0000-4000-8000-000000000000";
}

/**
 * Formulario unificado de actividad diaria:
 * - Sin `actividad`: crea un registro (GPRCIMPER-50) con selector buscable integrado (GPRCIMPER-29).
 * - Con `actividad`: edita un registro existente previo diálogo de confirmación (GPRCIMPER-34).
 */
export function FormActividadDiaria({
  actividad,
  selectedProyectoId: selectedProyectoIdProp,
  onProyectoChange,
  proyectos: proyectosProp,
  onSuccess,
}: {
  actividad?: ActividadDiaria;
  selectedProyectoId?: number | null;
  onProyectoChange?: (proyectoId: number | null) => void;
  proyectos?: ProyectoDisponibleActividad[];
  onSuccess?: (actualizada: ActividadDiaria) => void;
} = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const esRegistroDelSistemaPendiente = Boolean(
    actividad && !actividad.descripcion?.trim(),
  );
  const esEdicion = Boolean(actividad && actividad.descripcion?.trim());
  const habilitadoParaEditar =
    !esEdicion || puedeEditarActividad(actividad!.createdAt, user?.role?.name);

  const [proyectoId, setProyectoId] = useState<number | null>(() =>
    actividad ? actividad.proyectoId : (selectedProyectoIdProp ?? null),
  );
  const [fecha, setFecha] = useState(() =>
    actividad ? actividad.fecha.slice(0, 10) : fechaHoyIso(),
  );
  const [nombre, setNombre] = useState(() => actividad?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(
    () => actividad?.descripcion ?? "",
  );
  const [observaciones, setObservaciones] = useState(
    () => actividad?.observaciones ?? "",
  );
  const [claveOperacion, setClaveOperacion] = useState(nuevaClaveOperacion);
  const [confirmando, setConfirmando] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errores, setErrores] = useState<ErroresActividadDiaria>({
    campos: {},
  });
  const prevDescripcionRef = useRef(actividad?.descripcion?.trim() ?? "");

  useEffect(() => {
    const actual = actividad?.descripcion?.trim() ?? "";
    const previa = prevDescripcionRef.current;
    prevDescripcionRef.current = actual;
    if (!previa && actual && actividad && !descripcion.trim()) {
      setProyectoId(actividad.proyectoId);
      setFecha(actividad.fecha.slice(0, 10));
      setNombre(actividad.nombre);
      setDescripcion(actividad.descripcion);
      setObservaciones(actividad.observaciones ?? "");
    }
  }, [actividad, descripcion]);

  const {
    borradores,
    claveEnProceso,
    isReenviandoTodos,
    reenviar,
    descartar,
    agregarBorrador,
    eliminarBorrador,
    estadoModal,
    mostrarModal,
    cerrarModal,
  } = useBorradoresActividad({ autoSync: !esEdicion });

  const {
    data: proyectosQuery = [],
    isLoading: isLoadingProyectos,
    isError: isErrorProyectos,
  } = useQuery({
    queryKey: ["actividades-diarias", "proyectos-disponibles"],
    queryFn: listProyectosDisponiblesActividad,
    enabled: proyectosProp === undefined,
  });

  const proyectos = useMemo(
    () =>
      (proyectosProp ?? proyectosQuery).filter(
        (item) => item.estado === "ACTIVO",
      ),
    [proyectosProp, proyectosQuery],
  );

  const proyectosFormulario = useMemo(() => {
    if (
      actividad?.proyecto &&
      actividad.proyecto.estado === "ACTIVO" &&
      !proyectos.some((item) => item.id === actividad.proyecto!.id)
    ) {
      return [actividad.proyecto, ...proyectos];
    }
    return proyectos;
  }, [actividad, proyectos]);

  useEffect(() => {
    if (!esEdicion && selectedProyectoIdProp !== undefined) {
      setProyectoId(selectedProyectoIdProp);
    }
  }, [esEdicion, selectedProyectoIdProp]);

  const limpiarFormulario = useCallback(() => {
    const defecto =
      actividad?.proyectoId ??
      (proyectos.length === 1
        ? proyectos[0].id
        : (selectedProyectoIdProp ?? null));
    setProyectoId(defecto);
    setFecha(actividad ? actividad.fecha.slice(0, 10) : fechaHoyIso());
    setNombre(actividad?.nombre ?? "");
    setDescripcion("");
    setObservaciones("");
    setClaveOperacion(nuevaClaveOperacion());
    setErrores({ campos: {} });
  }, [actividad, proyectos, selectedProyectoIdProp]);

  const fechaHoy = fechaHoyIso();
  const maxFechaPermitida =
    esRegistroDelSistemaPendiente &&
    actividad?.fecha &&
    actividad.fecha.slice(0, 10) > fechaHoy
      ? actividad.fecha.slice(0, 10)
      : fechaHoy;

  function validarFormulario(): boolean {
    const camposValidacion: ErroresActividadDiaria["campos"] = {};
    if (!proyectoId || !Number.isInteger(proyectoId) || proyectoId < 1) {
      camposValidacion.proyectoId = "Selecciona un proyecto válido.";
    }
    if (!fecha.trim()) {
      camposValidacion.fecha =
        "Ingresa una fecha válida en formato AAAA-MM-DD.";
    } else if (fecha.trim() > maxFechaPermitida) {
      camposValidacion.fecha = "La fecha no puede ser futura.";
    }
    if (!nombre.trim()) {
      camposValidacion.nombre = "Ingresa el nombre de la actividad.";
    } else if (nombre.trim().length > 150) {
      camposValidacion.nombre = "El nombre admite hasta 150 caracteres.";
    }
    if (!descripcion.trim()) {
      camposValidacion.descripcion = "Ingresa la descripción de la actividad.";
    }

    if (Object.keys(camposValidacion).length > 0) {
      setErrores({ campos: camposValidacion });
      return false;
    }
    setErrores({ campos: {} });
    return true;
  }

  async function ejecutarCreacion() {
    if (!proyectoId) return;
    const payload = {
      claveOperacion,
      proyectoId,
      fecha: fecha.trim(),
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      observaciones: observaciones.trim() || undefined,
    };

    setIsPending(true);
    setErrores({ campos: {} });

    try {
      const respuesta = await registrarActividadDiaria(payload);
      eliminarBorrador(claveOperacion);
      await queryClient.invalidateQueries({
        queryKey: ["actividades-diarias"],
      });
      if (!esRegistroDelSistemaPendiente) {
        limpiarFormulario();
      }
      mostrarModal("exito");
      onSuccess?.(respuesta.actividad);
    } catch (error) {
      if (esErrorDeConexion(error)) {
        const proyectoSeleccionado = proyectos.find(
          (item) => item.id === proyectoId,
        );
        agregarBorrador({
          claveOperacion,
          payload,
          proyectoNombre: proyectoSeleccionado?.nombre,
          guardadoEn: new Date().toISOString(),
        });
        limpiarFormulario();
        mostrarModal("error_conexion");
      } else {
        setErrores(errorActividadDiaria(error));
      }
    } finally {
      setIsPending(false);
    }
  }

  async function confirmarEdicion() {
    if (!actividad || !proyectoId || isPending) return;
    setIsPending(true);
    setErrores({ campos: {} });
    try {
      const actualizada = await actualizarActividadDiaria(actividad.id, {
        proyectoId,
        fecha: fecha.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        observaciones: observaciones.trim() || undefined,
      });
      await queryClient.invalidateQueries({
        queryKey: ["actividades-diarias"],
      });
      setConfirmando(false);
      // CA3 (GPRCIMPER-34): Mostrar al usuario que ha podido editar el registro
      mostrarModal("editado");
      onSuccess?.(actualizada);
    } catch (error) {
      setConfirmando(false);
      setErrores(errorActividadDiaria(error));
    } finally {
      setIsPending(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isPending || !habilitadoParaEditar) return;
    if (!validarFormulario()) return;
    if (esEdicion) {
      // CA2 (GPRCIMPER-34): Solicitar confirmación antes de sobrescribir el registro anterior
      setConfirmando(true);
      return;
    }
    void ejecutarCreacion();
  }

  const campoFecha = (
    <InputField
      label="Fecha de la actividad"
      type="date"
      max={maxFechaPermitida}
      value={fecha}
      disabled={
        isPending || !habilitadoParaEditar || esRegistroDelSistemaPendiente
      }
      onChange={(event) => {
        setFecha(event.target.value);
        setErrores((prev) => ({
          ...prev,
          campos: { ...prev.campos, fecha: undefined },
        }));
      }}
      errorMessage={errores.campos.fecha}
      isRequired
    />
  );

  return (
    <div className="space-y-6">
      {!esEdicion && (
        <BorradoresActividad
          borradores={borradores}
          claveEnProceso={claveEnProceso}
          isReenviandoTodos={isReenviandoTodos}
          onReenviar={reenviar}
          onDescartar={descartar}
        />
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="max-w-3xl space-y-5 rounded-xl border border-gray-200 bg-white p-6"
      >
        {esRegistroDelSistemaPendiente && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span>
              Registro diario generado automáticamente por el sistema para este
              proyecto y fecha. Completa los datos y presiona{" "}
              <strong>Enviar</strong> para guardar el registro.
            </span>
          </div>
        )}

        {esEdicion && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <span className="text-gray-600">
              {actividad?.proyecto && actividad.proyecto.estado !== "ACTIVO"
                ? `Proyecto original: ${actividad.proyecto.nombre} (${actividad.proyecto.estado}). Selecciona un proyecto activo.`
                : "Puedes corregir los datos o reasignar el proyecto de la actividad."}
            </span>
            {habilitadoParaEditar && (
              <span className="rounded-full bg-gray-200 px-3 py-0.5 text-xs font-medium text-gray-800">
                Edición habilitada
              </span>
            )}
          </div>
        )}

        {esEdicion && !habilitadoParaEditar && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            El plazo de 48 horas para editar este registro ha vencido. Solo
            administración puede editarlo.
          </p>
        )}

        {isLoadingProyectos && habilitadoParaEditar && (
          <p role="status">Cargando proyectos asignados…</p>
        )}

        {isErrorProyectos && habilitadoParaEditar && (
          <p role="alert" className="text-sm text-red-700">
            No se pudieron cargar los proyectos disponibles en este momento.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectorProyectoActividad
            proyectos={proyectosFormulario}
            selectedProyectoId={proyectoId}
            onSelectProyecto={(id) => {
              setProyectoId(id);
              onProyectoChange?.(id);
              setErrores((prev) => ({
                ...prev,
                campos: { ...prev.campos, proyectoId: undefined },
              }));
            }}
            errorMessage={errores.campos.proyectoId}
            isDisabled={
              isPending ||
              !habilitadoParaEditar ||
              esRegistroDelSistemaPendiente
            }
            autoSelectSingle={!esEdicion}
            isRequired
          />

          {campoFecha}
        </div>

        <InputField
          label="Nombre de la actividad"
          placeholder="Ej. Impermeabilización de losa"
          maxLength={150}
          value={nombre}
          disabled={isPending || !habilitadoParaEditar}
          onChange={(event) => {
            setNombre(event.target.value);
            setErrores((prev) => ({
              ...prev,
              campos: { ...prev.campos, nombre: undefined },
            }));
          }}
          errorMessage={errores.campos.nombre}
          isRequired
        />

        <TextAreaField
          label="Descripción de la actividad"
          placeholder="Describe el trabajo realizado durante la jornada"
          rows={4}
          value={descripcion}
          disabled={isPending || !habilitadoParaEditar}
          onChange={(event) => {
            setDescripcion(event.target.value);
            setErrores((prev) => ({
              ...prev,
              campos: { ...prev.campos, descripcion: undefined },
            }));
          }}
          errorMessage={errores.campos.descripcion}
          isRequired
        />

        <TextAreaField
          label="Observaciones"
          placeholder="Incidentes, notas adicionales o comentarios opcionales"
          rows={3}
          value={observaciones}
          disabled={isPending || !habilitadoParaEditar}
          onChange={(event) => {
            setObservaciones(event.target.value);
            setErrores((prev) => ({
              ...prev,
              campos: { ...prev.campos, observaciones: undefined },
            }));
          }}
          errorMessage={errores.campos.observaciones}
        />

        {errores.general && Object.keys(errores.campos).length === 0 && (
          <p
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            {errores.general}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            isPending={isPending}
            isDisabled={isPending || !habilitadoParaEditar}
          >
            {esEdicion ? "Guardar cambios" : "Enviar"}
          </Button>
          <Link
            to="/actividades-diarias"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Link>
        </div>
      </form>

      {esEdicion && (
        <AlertDialog
          isOpen={confirmando}
          onOpenChange={(open) => {
            if (!isPending) setConfirmando(open);
          }}
        >
          <AlertDialog.Backdrop>
            <AlertDialog.Container>
              <AlertDialog.Dialog>
                <AlertDialog.Header>
                  <AlertDialog.Heading>
                    Confirmar edición de registro
                  </AlertDialog.Heading>
                </AlertDialog.Header>
                <AlertDialog.Body>
                  <p>
                    ¿Estás seguro de sobrescribir el registro anterior con las
                    correcciones realizadas?
                  </p>
                </AlertDialog.Body>
                <AlertDialog.Footer>
                  <Button
                    type="button"
                    variant="tertiary"
                    isDisabled={isPending}
                    onClick={() => setConfirmando(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    isPending={isPending}
                    isDisabled={isPending}
                    onClick={() => void confirmarEdicion()}
                  >
                    Confirmar cambios
                  </Button>
                </AlertDialog.Footer>
              </AlertDialog.Dialog>
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>
      )}

      <ModalResultadoActividad estado={estadoModal} onClose={cerrarModal} />
    </div>
  );
}
