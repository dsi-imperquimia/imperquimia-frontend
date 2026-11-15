import { Calendar } from "@heroui/react/calendar";
import { DateField } from "@heroui/react/date-field";
import { DatePicker } from "@heroui/react/date-picker";
import { FieldError } from "@heroui/react/field-error";
import { Label } from "@heroui/react/label";
import { parseDate, type DateValue } from "@internationalized/date";
import type { ReactNode } from "react";

/** Convierte AAAA-MM-DD en fecha de calendario; null si no es válida. */
function aFechaCalendario(valor?: string | null): DateValue | null {
  if (!valor) return null;
  try {
    return parseDate(valor);
  } catch {
    return null;
  }
}

export interface DatePickerFieldProps {
  label: string;
  /** Fecha en formato AAAA-MM-DD ("" si no hay selección). */
  value: string;
  /** Recibe la fecha en formato AAAA-MM-DD ("" si se borra). */
  onChange: (valor: string) => void;
  /** Fecha máxima permitida en formato AAAA-MM-DD. */
  max?: string;
  /** Fecha mínima permitida en formato AAAA-MM-DD. */
  min?: string;
  errorMessage?: ReactNode;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
}

/**
 * Selector de fecha de HeroUI (DatePicker + DateField + Calendar) que mantiene
 * el contrato del proyecto: valores como texto AAAA-MM-DD.
 */
export function DatePickerField({
  label,
  value,
  onChange,
  max,
  min,
  errorMessage,
  isRequired,
  isDisabled,
  className,
}: DatePickerFieldProps) {
  return (
    <DatePicker
      className={className ?? "w-full"}
      value={aFechaCalendario(value)}
      onChange={(fecha) => onChange(fecha ? fecha.toString() : "")}
      maxValue={aFechaCalendario(max)}
      minValue={aFechaCalendario(min)}
      isInvalid={!!errorMessage}
      isRequired={isRequired}
      isDisabled={isDisabled}
      validationBehavior="aria" // la validación la maneja el formulario
    >
      <Label>{label}</Label>
      <DateField.Group fullWidth variant="secondary">
        <DateField.Input>
          {(segment) => <DateField.Segment segment={segment} />}
        </DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger>
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      {errorMessage && <FieldError>{errorMessage}</FieldError>}
      <DatePicker.Popover>
        <Calendar aria-label={label}>
          <Calendar.Header>
            <Calendar.YearPickerTrigger>
              <Calendar.YearPickerTriggerHeading />
              <Calendar.YearPickerTriggerIndicator />
            </Calendar.YearPickerTrigger>
            <Calendar.NavButton slot="previous" />
            <Calendar.NavButton slot="next" />
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>
              {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date) => <Calendar.Cell date={date} />}
            </Calendar.GridBody>
          </Calendar.Grid>
          <Calendar.YearPickerGrid>
            <Calendar.YearPickerGridBody>
              {({ year }) => <Calendar.YearPickerCell year={year} />}
            </Calendar.YearPickerGridBody>
          </Calendar.YearPickerGrid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  );
}
