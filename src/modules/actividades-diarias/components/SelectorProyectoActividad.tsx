import { ComboBox } from "@heroui/react/combo-box";
import { Description } from "@heroui/react/description";
import { FieldError } from "@heroui/react/field-error";
import { Input } from "@heroui/react/input";
import { Label } from "@heroui/react/label";
import { ListBox } from "@heroui/react/list-box";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  normalizarTexto,
  type ProyectoDisponibleActividad,
} from "../types/actividad-diaria";

/**
 * GPRCIMPER-29 (CA1, CA2, CA3):
 * Selector con búsqueda integrada sobre proyectos con estado ACTIVO asignados como Jefe de Proyecto.
 * Si existe un único proyecto activo, lo selecciona automáticamente por defecto.
 */
export function SelectorProyectoActividad({
  proyectos,
  selectedProyectoId,
  onSelectProyecto,
  label = "Proyecto",
  placeholder = "Buscar o seleccionar proyecto",
  description,
  errorMessage,
  isRequired = false,
  isDisabled = false,
  autoSelectSingle = true,
}: {
  proyectos: ProyectoDisponibleActividad[];
  selectedProyectoId: number | null;
  onSelectProyecto: (proyectoId: number | null) => void;
  label?: string;
  placeholder?: string;
  description?: string;
  errorMessage?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  autoSelectSingle?: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const autoSeleccionadoRef = useRef(false);
  const editandoDesdeInputRef = useRef(false);

  // CA1: Solo proyectos activos asignados
  const proyectosActivos = useMemo(
    () => proyectos.filter((item) => item.estado === "ACTIVO"),
    [proyectos],
  );

  const proyectoSeleccionado = useMemo(
    () =>
      selectedProyectoId === null
        ? undefined
        : proyectosActivos.find((item) => item.id === selectedProyectoId),
    [proyectosActivos, selectedProyectoId],
  );

  // Sincroniza el texto visible cuando selectedProyectoId viene preestablecido o cambia desde fuera
  useEffect(() => {
    if (editandoDesdeInputRef.current) {
      editandoDesdeInputRef.current = false;
      return;
    }
    setBusqueda(proyectoSeleccionado?.nombre ?? "");
  }, [proyectoSeleccionado]);

  // CA2: Si solamente existe un proyecto activo, aparece seleccionado por defecto una vez
  useEffect(() => {
    if (
      autoSelectSingle &&
      !autoSeleccionadoRef.current &&
      proyectosActivos.length === 1 &&
      selectedProyectoId === null
    ) {
      autoSeleccionadoRef.current = true;
      onSelectProyecto(proyectosActivos[0].id);
    }
  }, [
    autoSelectSingle,
    onSelectProyecto,
    proyectosActivos,
    selectedProyectoId,
  ]);

  // CA3: Búsqueda rápida por nombre; si coincide con el ya seleccionado, muestra todos para poder cambiar
  const proyectosFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim());
    if (
      !termino ||
      (proyectoSeleccionado &&
        termino === normalizarTexto(proyectoSeleccionado.nombre))
    ) {
      return proyectosActivos;
    }
    return proyectosActivos.filter((proyecto) =>
      normalizarTexto(proyecto.nombre).includes(termino),
    );
  }, [busqueda, proyectoSeleccionado, proyectosActivos]);

  const descripcionMostrada =
    description ??
    (proyectosActivos.length === 1 && !errorMessage
      ? "Tu único proyecto activo está seleccionado por defecto."
      : undefined);

  return (
    <ComboBox
      items={proyectosFiltrados}
      inputValue={busqueda}
      selectedKey={
        selectedProyectoId !== null ? String(selectedProyectoId) : null
      }
      onInputChange={(value) => {
        setBusqueda(value);
        if (proyectoSeleccionado && value !== proyectoSeleccionado.nombre) {
          editandoDesdeInputRef.current = true;
          onSelectProyecto(null);
        }
      }}
      onSelectionChange={(key) => {
        editandoDesdeInputRef.current = false;
        const valor = String(key ?? "");
        const idNumero = valor ? Number(valor) : null;
        const elegido =
          idNumero !== null
            ? proyectosActivos.find((item) => item.id === idNumero)
            : undefined;
        setBusqueda(elegido?.nombre ?? "");
        onSelectProyecto(idNumero);
      }}
      allowsCustomValue={false}
      menuTrigger="focus"
      variant="secondary"
      validationBehavior="aria"
      isInvalid={!!errorMessage}
      isDisabled={isDisabled}
      isRequired={isRequired}
      fullWidth
    >
      <Label>{label}</Label>
      <ComboBox.InputGroup>
        <Input placeholder={placeholder} />
        <ComboBox.Trigger aria-label={`Mostrar opciones de ${label}`} />
      </ComboBox.InputGroup>
      {descripcionMostrada && <Description>{descripcionMostrada}</Description>}
      <ComboBox.Popover>
        <ListBox
          items={proyectosFiltrados}
          renderEmptyState={() => (
            <p className="px-3 py-2 text-sm text-gray-500">
              No se encontraron proyectos con ese nombre.
            </p>
          )}
        >
          {(proyecto) => (
            <ListBox.Item id={String(proyecto.id)} textValue={proyecto.nombre}>
              <div className="flex w-full items-center justify-between gap-3">
                <span>{proyecto.nombre}</span>
                {proyecto.ubicacion && (
                  <span className="text-xs text-gray-500">
                    {proyecto.ubicacion}
                  </span>
                )}
              </div>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          )}
        </ListBox>
      </ComboBox.Popover>
      {errorMessage && <FieldError>{errorMessage}</FieldError>}
    </ComboBox>
  );
}
