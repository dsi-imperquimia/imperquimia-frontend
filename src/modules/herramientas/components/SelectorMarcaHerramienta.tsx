import { useQuery } from "@tanstack/react-query";
import { listMarcasHerramienta } from "../api/marcasHerramienta";

interface Props {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  errorMessage?: string;
}

export function SelectorMarcaHerramienta({
  value,
  onChange,
  onBlur,
  errorMessage,
}: Props) {
  const {
    data: marcas = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: ["marcas-herramienta"],
    queryFn: () => listMarcasHerramienta(),
  });
  const disponibles = marcas.filter((marca) => marca.activo || marca.id === value);

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span>Marca de herramienta</span>
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
          {isPending ? "Cargando marcas..." : "Selecciona una marca"}
        </option>
        {disponibles.map((marca) => (
          <option key={marca.id} value={marca.id}>
            {marca.nombre}
            {marca.activo ? "" : " (inactiva)"}
          </option>
        ))}
      </select>
      {isError && (
        <span className="text-red-600">No se pudo cargar el catálogo de marcas.</span>
      )}
      {errorMessage && <span className="text-red-600">{errorMessage}</span>}
    </label>
  );
}
