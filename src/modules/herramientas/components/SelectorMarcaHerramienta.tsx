import { SelectedField } from "@components/fields/SelectedField";
import { ListBox } from "@heroui/react/list-box";
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
  const disponibles = marcas.filter(
    (marca) => marca.activo || marca.id === value,
  );

  return (
    <SelectedField
      label="Marca de herramienta"
      placeholder={isPending ? "Cargando marcas..." : "Selecciona una marca"}
      selectedKey={value ? String(value) : null}
      onSelectionChange={(key) => onChange(Number(key))}
      onBlur={onBlur}
      isRequired
      isDisabled={isPending || isError}
      errorMessage={
        isError
          ? "No se pudo cargar el catálogo de marcas."
          : (errorMessage ?? "")
      }
    >
      {disponibles.map((marca) => (
        <ListBox.Item
          key={marca.id}
          id={String(marca.id)}
          textValue={marca.nombre}
        >
          {marca.nombre}
          {marca.activo ? "" : " (inactiva)"}
        </ListBox.Item>
      ))}
    </SelectedField>
  );
}
