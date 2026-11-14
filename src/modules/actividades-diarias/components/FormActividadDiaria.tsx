import { InputField } from "@components/fields/InputField";
import { SelectedField } from "@components/fields/SelectedField";
import { TextAreaField } from "@components/fields/TextAreaField";
import { Button } from "@heroui/react/button";
import { ListBox } from "@heroui/react/list-box";
import { useAuth } from "@modules/auth/store/authStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  errorActividadDiaria,
  esErrorDeConexion,
  listProyectosDisponiblesActividad,
  registrarActividadDiaria,
} from "../api/actividades-diarias";
import {
  eliminarBorradorActividad,
  guardarBorradorActividad,
  listarBorradoresActividad,
  marcarErrorBorradorActividad,
  reenviarBorradoresActividad,
} from "../api/borradores-actividad";
import type {
  BorradorActividad,
  ErroresActividadDiaria,
  ProyectoDisponibleActividad,
} from "../types/actividad-diaria";
import { BorradoresActividad } from "./BorradoresActividad";
import {
  ModalResultadoActividad,
  type EstadoModalResultadoActividad,
} from "./ModalResultadoActividad";

function fechaHoyIso(): string {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function nuevaClaveOperacion(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  return "00000000-0000-4000-8000-000000000000";
}

function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

export function FormActividadDiaria({
  selectedProyectoId,
  onProyectoChange,
  proyectos: proyectosProp,
}: {
  selectedProyectoId?: number | null;
  onProyectoChange?: (proyectoId: number | null) => void;
  proyectos?: ProyectoDisponibleActividad[];
} = {}) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const [busquedaProyecto, setBusquedaProyecto] = useState("");
  const [proyectoId, setProyectoId] = useState(() =>
    selectedProyectoId ? String(selectedProyectoId) : "",
  );
  const [fecha, setFecha] = useState(fechaHoyIso);
  const [descripcion, setDescripcion] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [claveOperacion, setClaveOperacion] = useState(nuevaClaveOperacion);
  const [isPending, setIsPending] = useState(false);
  const [errores, setErrores] = useState<ErroresActividadDiaria>({
    campos: {},
  });
  const [estadoModal, setEstadoModal] =
    useState<EstadoModalResultadoActividad>(null);

  const [borradores, setBorradores] = useState<BorradorActividad[]>(() =>
    listarBorradoresActividad(userId),
  );
  const [claveEnProceso, setClaveEnProceso] = useState<string | null>(null);
  const [isReenviandoTodos, setIsReenviandoTodos] = useState(false);

  const {
    data: proyectosQuery = [],
    isLoading: isLoadingProyectos,
    isError: isErrorProyectos,
  } = useQuery({
    queryKey: ["actividades-diarias", "proyectos-disponibles"],
    queryFn: listProyectosDisponiblesActividad,
    enabled: proyectosProp === undefined,
  });

  // CA1 (GPRCIMPER-29): Solo proyectos activos donde el usuario es Jefe de Proyecto
  const proyectos = useMemo(
    () =>
      (proyectosProp ?? proyectosQuery).filter(
        (item) => item.estado === "ACTIVO",
      ),
    [proyectosProp, proyectosQuery],
  );

  // CA3 (GPRCIMPER-29): Búsqueda rápida por nombre de proyecto
  const proyectosFiltrados = useMemo(() => {
    const termino = normalizarTexto(busquedaProyecto.trim());
    if (!termino) return proyectos;
    return proyectos.filter(
      (proyecto) =>
        String(proyecto.id) === proyectoId ||
        normalizarTexto(proyecto.nombre).includes(termino),
    );
  }, [busquedaProyecto, proyectos, proyectoId]);

  useEffect(() => {
    if (selectedProyectoId !== undefined) {
      setProyectoId(selectedProyectoId ? String(selectedProyectoId) : "");
    }
  }, [selectedProyectoId]);

  // CA2 (GPRCIMPER-29): Si el usuario solamente tiene un proyecto activo, debe aparecer seleccionado por defecto
  useEffect(() => {
    if (proyectos.length === 1 && !proyectoId) {
      const unicoId = proyectos[0].id;
      setProyectoId(String(unicoId));
      onProyectoChange?.(unicoId);
    }
  }, [proyectos, proyectoId, onProyectoChange]);

  useEffect(() => {
    setBorradores(listarBorradoresActividad(userId));
  }, [userId]);

  const sincronizarBorradores = useCallback(async () => {
    const actuales = listarBorradoresActividad(userId);
    if (actuales.length === 0) return;
    setIsReenviandoTodos(true);
    try {
      const resultado = await reenviarBorradoresActividad(userId);
      setBorradores(resultado.pendientes);
      if (resultado.enviados > 0) {
        await queryClient.invalidateQueries({
          queryKey: ["actividades-diarias"],
        });
        setEstadoModal("exito");
      }
    } finally {
      setIsReenviandoTodos(false);
    }
  }, [queryClient, userId]);

  useEffect(() => {
    void sincronizarBorradores();
    const handleOnline = () => {
      void sincronizarBorradores();
    };
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [sincronizarBorradores]);

  const limpiarFormulario = useCallback(() => {
    const idPorDefecto =
      proyectos.length === 1
        ? String(proyectos[0].id)
        : selectedProyectoId
          ? String(selectedProyectoId)
          : "";
    setProyectoId(idPorDefecto);
    setBusquedaProyecto("");
    setFecha(fechaHoyIso());
    setDescripcion("");
    setObservaciones("");
    setClaveOperacion(nuevaClaveOperacion());
    setErrores({ campos: {} });
  }, [proyectos, selectedProyectoId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isPending) return;

    const camposValidacion: ErroresActividadDiaria["campos"] = {};
    const proyectoNumero = Number(proyectoId);
    if (
      !proyectoId ||
      !Number.isInteger(proyectoNumero) ||
      proyectoNumero < 1
    ) {
      camposValidacion.proyectoId = "Selecciona un proyecto válido.";
    }
    if (!fecha.trim()) {
      camposValidacion.fecha =
        "Ingresa una fecha válida en formato AAAA-MM-DD.";
    } else if (fecha.trim() > fechaHoyIso()) {
      camposValidacion.fecha = "La fecha no puede ser futura.";
    }
    if (!descripcion.trim()) {
      camposValidacion.descripcion = "Ingresa la descripción de la actividad.";
    }

    if (Object.keys(camposValidacion).length > 0) {
      setErrores({ campos: camposValidacion });
      return;
    }

    const payload = {
      claveOperacion,
      proyectoId: proyectoNumero,
      fecha: fecha.trim(),
      descripcion: descripcion.trim(),
      observaciones: observaciones.trim() || undefined,
    };

    setIsPending(true);
    setErrores({ campos: {} });

    try {
      await registrarActividadDiaria(payload);
      const siguientes = eliminarBorradorActividad(userId, claveOperacion);
      setBorradores(siguientes);
      await queryClient.invalidateQueries({
        queryKey: ["actividades-diarias"],
      });
      limpiarFormulario();
      setEstadoModal("exito");
    } catch (error) {
      if (esErrorDeConexion(error)) {
        const proyectoSeleccionado = proyectos.find(
          (item) => item.id === proyectoNumero,
        );
        const siguientes = guardarBorradorActividad(userId, {
          claveOperacion,
          payload,
          proyectoNombre: proyectoSeleccionado?.nombre,
          guardadoEn: new Date().toISOString(),
        });
        setBorradores(siguientes);
        limpiarFormulario();
        setEstadoModal("error_conexion");
      } else {
        setErrores(errorActividadDiaria(error));
      }
    } finally {
      setIsPending(false);
    }
  }

  async function handleReenviarBorrador(borrador: BorradorActividad) {
    if (claveEnProceso || isReenviandoTodos) return;
    setClaveEnProceso(borrador.claveOperacion);
    try {
      await registrarActividadDiaria(borrador.payload);
      const siguientes = eliminarBorradorActividad(
        userId,
        borrador.claveOperacion,
      );
      setBorradores(siguientes);
      await queryClient.invalidateQueries({
        queryKey: ["actividades-diarias"],
      });
      setEstadoModal("exito");
    } catch (error) {
      if (esErrorDeConexion(error)) {
        setEstadoModal("error_conexion");
      } else {
        const detalle = errorActividadDiaria(error);
        const siguientes = marcarErrorBorradorActividad(
          userId,
          borrador.claveOperacion,
          detalle.general ?? "No se pudo reenviar el borrador.",
        );
        setBorradores(siguientes);
      }
    } finally {
      setClaveEnProceso(null);
    }
  }

  function handleDescartarBorrador(clave: string) {
    const siguientes = eliminarBorradorActividad(userId, clave);
    setBorradores(siguientes);
  }

  const handleCloseModal = useCallback(() => {
    setEstadoModal(null);
  }, []);

  return (
    <div className="space-y-6">
      <BorradoresActividad
        borradores={borradores}
        claveEnProceso={claveEnProceso}
        isReenviandoTodos={isReenviandoTodos}
        onReenviar={handleReenviarBorrador}
        onDescartar={handleDescartarBorrador}
      />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="max-w-3xl space-y-5 rounded-xl border border-gray-200 bg-white p-6"
      >
        <p className="text-sm text-gray-500">
          Selecciona uno de tus proyectos activos asignados como Jefe de
          Proyecto y registra las labores realizadas durante la jornada.
        </p>

        {isLoadingProyectos && (
          <p role="status">Cargando proyectos asignados…</p>
        )}

        {isErrorProyectos && (
          <p role="alert" className="text-sm text-red-700">
            No se pudieron cargar los proyectos disponibles en este momento.
          </p>
        )}

        {proyectos.length > 1 && (
          <InputField
            label="Buscar proyecto asignado"
            placeholder="Filtrar por nombre de proyecto"
            value={busquedaProyecto}
            disabled={isPending}
            onChange={(event) => setBusquedaProyecto(event.target.value)}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectedField
            label="Proyecto"
            placeholder="Selecciona un proyecto"
            selectedKey={proyectoId || null}
            onSelectionChange={(key) => {
              const valor = String(key ?? "");
              setProyectoId(valor);
              onProyectoChange?.(valor ? Number(valor) : null);
              setErrores((prev) => ({
                ...prev,
                campos: { ...prev.campos, proyectoId: undefined },
              }));
            }}
            errorMessage={errores.campos.proyectoId}
            isRequired
          >
            {proyectosFiltrados.map((proyecto) => (
              <ListBox.Item
                key={proyecto.id}
                id={String(proyecto.id)}
                textValue={proyecto.nombre}
              >
                {proyecto.nombre}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </SelectedField>

          <InputField
            label="Fecha de la actividad"
            type="date"
            max={fechaHoyIso()}
            value={fecha}
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
        </div>

        <TextAreaField
          label="Descripción de la actividad"
          placeholder="Describe el trabajo realizado durante la jornada"
          rows={4}
          value={descripcion}
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

        <div className="flex items-center gap-4">
          <Button type="submit" isPending={isPending} isDisabled={isPending}>
            Enviar
          </Button>
          <Link to="/actividades-diarias" className="text-sm text-gray-600">
            Cancelar
          </Link>
        </div>
      </form>

      <ModalResultadoActividad
        estado={estadoModal}
        onClose={handleCloseModal}
      />
    </div>
  );
}
