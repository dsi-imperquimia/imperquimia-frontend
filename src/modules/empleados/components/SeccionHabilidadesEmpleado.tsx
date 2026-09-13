import {
  Button,
  Checkbox,
  CheckboxGroup,
  Description,
  Label,
  Spinner,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { listHabilidades } from "../api/habilidadesApi";

interface Props {
  value: number[];
  onChange: (ids: number[]) => void;
  onBlur: () => void;
  errorMessage?: string;
  isDisabled?: boolean;
}

export function SeccionHabilidadesEmpleado({
  value,
  onChange,
  onBlur,
  errorMessage,
  isDisabled,
}: Props) {
  const {
    data: habilidades = [],
    isPending,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["habilidades"],
    queryFn: listHabilidades,
  });

  return (
    <section
      className="space-y-3 border-t border-border pt-4"
      aria-label="Habilidades del empleado"
    >
      <CheckboxGroup
        name="habilidadesIds"
        value={value.map(String)}
        onChange={(ids) => onChange(ids.map(Number))}
        onBlur={onBlur}
        isDisabled={isDisabled || isPending || Boolean(error)}
        isInvalid={Boolean(errorMessage)}
        className="gap-3"
      >
        <Label>Habilidades del empleado</Label>
        <Description>
          Selecciona las habilidades que posee. Los cambios se aplicarán al
          guardar el empleado.
        </Description>
        {isPending ? (
          <div
            role="status"
            className="flex items-center gap-2 text-sm text-muted"
          >
            <Spinner size="sm" /> Cargando habilidades…
          </div>
        ) : error ? (
          <p role="alert" className="text-sm text-danger">
            No se pudo cargar el catálogo de habilidades. Tu selección se
            conserva.
          </p>
        ) : habilidades.length === 0 ? (
          <p className="text-sm text-muted">
            No hay habilidades disponibles. Puedes agregarlas en el Catálogo de
            Habilidades.
          </p>
        ) : (
          <div className="flex max-h-64 flex-col gap-3 overflow-y-auto p-1">
            {habilidades.map((habilidad) => (
              <Checkbox
                key={habilidad.id}
                value={String(habilidad.id)}
                aria-label={habilidad.nombre}
              >
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Label>{habilidad.nombre}</Label>
                </Checkbox.Content>
                {habilidad.descripcion && (
                  <Description>{habilidad.descripcion}</Description>
                )}
              </Checkbox>
            ))}
          </div>
        )}
      </CheckboxGroup>
      {error && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onPress={() => void refetch()}
          isPending={isFetching}
          isDisabled={isDisabled}
        >
          Reintentar
        </Button>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted" aria-live="polite">
          {value.length}{" "}
          {value.length === 1
            ? "habilidad seleccionada"
            : "habilidades seleccionadas"}
        </span>
        {value.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            isDisabled={isDisabled || isPending || Boolean(error)}
            onPress={() => onChange([])}
          >
            Quitar todas
          </Button>
        )}
      </div>
      {errorMessage && (
        <p role="alert" className="text-sm text-danger">
          {errorMessage}
        </p>
      )}
    </section>
  );
}
