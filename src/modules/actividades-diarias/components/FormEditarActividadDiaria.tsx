import { InputField } from "@components/fields/InputField";
import { TextAreaField } from "@components/fields/TextAreaField";
import { AlertDialog } from "@heroui/react/alert-dialog";
import { Button } from "@heroui/react/button";
import { Modal } from "@heroui/react/modal";
import { useAuth } from "@modules/auth/store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  actualizarActividadDiaria,
  errorActividadDiaria,
} from "../api/actividades-diarias";
import {
  MENSAJES_ACTIVIDAD,
  puedeEditarActividad,
  type ActividadDiaria,
  type ErroresActividadDiaria,
} from "../types/actividad-diaria";

function fechaHoyIso(): string {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export function FormEditarActividadDiaria({
  actividad,
  onSuccess,
}: {
  actividad: ActividadDiaria;
  onSuccess?: (actualizada: ActividadDiaria) => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [fecha, setFecha] = useState(() => actividad.fecha.slice(0, 10));
  const [descripcion, setDescripcion] = useState(actividad.descripcion);
  const [observaciones, setObservaciones] = useState(
    actividad.observaciones ?? "",
  );
  const [errores, setErrores] = useState<ErroresActividadDiaria>({
    campos: {},
  });
  const [confirmando, setConfirmando] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [editadoConExito, setEditadoConExito] = useState(false);

  const habilitadoPorPlazoORol = puedeEditarActividad(
    actividad.createdAt,
    user?.role?.name,
  );

  function validarFormulario(): boolean {
    const camposValidacion: ErroresActividadDiaria["campos"] = {};
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
      return false;
    }
    setErrores({ campos: {} });
    return true;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isPending || !habilitadoPorPlazoORol) return;
    if (!validarFormulario()) return;
    // CA2 (GPRCIMPER-34): Solicitar confirmación antes de sobrescribir el registro anterior
    setConfirmando(true);
  }

  async function confirmarEdicion() {
    if (isPending) return;
    setIsPending(true);
    setErrores({ campos: {} });
    try {
      const actualizada = await actualizarActividadDiaria(actividad.id, {
        fecha: fecha.trim(),
        descripcion: descripcion.trim(),
        observaciones: observaciones.trim() || undefined,
      });
      await queryClient.invalidateQueries({
        queryKey: ["actividades-diarias"],
      });
      setConfirmando(false);
      // CA3 (GPRCIMPER-34): Mostrar al usuario que ha podido editar el registro
      setEditadoConExito(true);
      onSuccess?.(actualizada);
    } catch (error) {
      setConfirmando(false);
      setErrores(errorActividadDiaria(error));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="max-w-3xl space-y-5 rounded-xl border border-gray-200 bg-white p-6"
      >
        <p className="text-sm text-gray-500">
          Proyecto:{" "}
          <span className="font-semibold text-gray-900">
            {actividad.proyecto?.nombre ?? `Proyecto #${actividad.proyectoId}`}
          </span>
        </p>

        {!habilitadoPorPlazoORol && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            El plazo de 48 horas para editar este registro ha vencido. Solo
            administración puede editarlo.
          </p>
        )}

        <InputField
          label="Fecha de la actividad"
          type="date"
          max={fechaHoyIso()}
          value={fecha}
          disabled={isPending || !habilitadoPorPlazoORol}
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

        <TextAreaField
          label="Descripción de la actividad"
          placeholder="Describe el trabajo realizado durante la jornada"
          rows={4}
          value={descripcion}
          disabled={isPending || !habilitadoPorPlazoORol}
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
          disabled={isPending || !habilitadoPorPlazoORol}
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
          <Button
            type="submit"
            isPending={isPending}
            isDisabled={isPending || !habilitadoPorPlazoORol}
          >
            Guardar cambios
          </Button>
          <Link to="/actividades-diarias" className="text-sm text-gray-600">
            Cancelar
          </Link>
        </div>
      </form>

      {/* CA2 (GPRCIMPER-34): Confirmación antes de sobrescribir el registro anterior */}
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

      {/* CA3 (GPRCIMPER-34): Mostrar al usuario que ha podido editar el registro */}
      <Modal
        isOpen={editadoConExito}
        onOpenChange={(open) => {
          if (!open) setEditadoConExito(false);
        }}
      >
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="w-full sm:max-w-md">
              <Modal.Header>
                <Modal.Heading>Edición completada</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p role="status" aria-live="polite">
                  {MENSAJES_ACTIVIDAD.editadoExito}
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button type="button" onClick={() => setEditadoConExito(false)}>
                  Aceptar
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
