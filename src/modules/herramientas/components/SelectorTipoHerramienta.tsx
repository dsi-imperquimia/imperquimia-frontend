import { useQuery } from "@tanstack/react-query";
import { listTiposHerramienta } from "../api/tiposHerramienta";

interface Props {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  errorMessage?: string;
}

export function SelectorTipoHerramienta({
  value,
  onChange,
  onBlur,
  errorMessage,
}: Props) {
  const {
    data: tipos = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: ["tipos-herramienta"],
    queryFn: () => listTiposHerramienta(),
  });
  const disponibles = tipos.filter((tipo) => tipo.activo || tipo.id === value);

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span>Tipo de herramienta</span>
      <select
        className="min-h-10 rounded-lg border border-gray-300 bg-white px-3"
        value={value || ""}
        onChange={(event) => onChange(Number(event.target.value))}
        onBlur={onBlur}
        disabled={isPending || isError}
        required
        aria-invalid={!!errorMessage}
      >
        <option value="">
          {isPending ? "Cargando tipos..." : "Selecciona un tipo"}
        </option>
        {disponibles.map((tipo) => (
          <option key={tipo.id} value={tipo.id}>
            {tipo.nombre}
            {tipo.activo ? "" : " (inactivo)"}
          </option>
        ))}
      </select>
      {isError && (
        <span className="text-red-600">
          No se pudo cargar el catálogo de tipos.
        </span>
      )}
      {errorMessage && <span className="text-red-600">{errorMessage}</span>}
    </label>
  );
}
