import { useAuth } from "@modules/auth/store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  errorActividadDiaria,
  esErrorDeConexion,
  registrarActividadDiaria,
} from "../api/actividades-diarias";
import {
  eliminarBorradorActividad,
  guardarBorradorActividad,
  listarBorradoresActividad,
  marcarErrorBorradorActividad,
  reenviarBorradoresActividad,
} from "../api/borradores-actividad";
import type { BorradorActividad } from "../types/actividad-diaria";
import type { EstadoModalResultadoActividad } from "../components/ModalResultadoActividad";

/**
 * GPRCIMPER-50 (CA3): borradores en localStorage.
 * Se reenvían solos al montar la vista y al recuperar la conexión,
 * y se eliminan en cuanto el backend confirma el guardado.
 */
export function useBorradoresActividad({
  autoSync = true,
}: { autoSync?: boolean } = {}) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const [borradores, setBorradores] = useState<BorradorActividad[]>(() =>
    listarBorradoresActividad(userId),
  );
  const [claveEnProceso, setClaveEnProceso] = useState<string | null>(null);
  const [isReenviandoTodos, setIsReenviandoTodos] = useState(false);
  const [estadoModal, setEstadoModal] =
    useState<EstadoModalResultadoActividad>(null);

  useEffect(() => {
    setBorradores(listarBorradoresActividad(userId));
  }, [userId]);

  const refrescarActividades = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["actividades-diarias"] }),
    [queryClient],
  );

  const sincronizar = useCallback(async () => {
    if (listarBorradoresActividad(userId).length === 0) {
      setBorradores([]);
      return;
    }
    setIsReenviandoTodos(true);
    try {
      const resultado = await reenviarBorradoresActividad(userId);
      setBorradores(resultado.pendientes);
      if (resultado.enviados > 0) {
        await refrescarActividades();
        setEstadoModal("exito");
      }
    } finally {
      setIsReenviandoTodos(false);
    }
  }, [refrescarActividades, userId]);

  useEffect(() => {
    if (!autoSync) return;
    void sincronizar();
    const handleOnline = () => void sincronizar();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [autoSync, sincronizar]);

  async function reenviar(borrador: BorradorActividad) {
    if (claveEnProceso || isReenviandoTodos) return;
    setClaveEnProceso(borrador.claveOperacion);
    try {
      await registrarActividadDiaria(borrador.payload);
      setBorradores(eliminarBorradorActividad(userId, borrador.claveOperacion));
      await refrescarActividades();
      setEstadoModal("exito");
    } catch (error) {
      if (esErrorDeConexion(error)) {
        setEstadoModal("error_conexion");
      } else {
        setBorradores(
          marcarErrorBorradorActividad(
            userId,
            borrador.claveOperacion,
            errorActividadDiaria(error).general ??
              "No se pudo reenviar el borrador.",
          ),
        );
      }
    } finally {
      setClaveEnProceso(null);
    }
  }

  const agregarBorrador = useCallback(
    (borrador: BorradorActividad) => {
      setBorradores(guardarBorradorActividad(userId, borrador));
    },
    [userId],
  );

  const eliminarBorrador = useCallback(
    (claveOperacion: string) => {
      setBorradores(eliminarBorradorActividad(userId, claveOperacion));
    },
    [userId],
  );

  const mostrarModal = useCallback((estado: EstadoModalResultadoActividad) => {
    setEstadoModal(estado);
  }, []);

  const cerrarModal = useCallback(() => setEstadoModal(null), []);

  return {
    borradores,
    claveEnProceso,
    isReenviandoTodos,
    reenviar,
    descartar: eliminarBorrador,
    agregarBorrador,
    eliminarBorrador,
    estadoModal,
    mostrarModal,
    cerrarModal,
  };
}
