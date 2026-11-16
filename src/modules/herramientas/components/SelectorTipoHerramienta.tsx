import { SelectedField } from "@components/fields/SelectedField";
import { ListBox } from "@heroui/react/list-box";
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
    <SelectedField
      label="Tipo de herramienta"
      placeholder={isPending ? "Cargando tipos..." : "Selecciona un tipo"}
      selectedKey={value ? String(value) : null}
      onSelectionChange={(key) => onChange(Number(key))}
      onBlur={onBlur}
      isRequired
      isDisabled={isPending || isError}
      errorMessage={
        isError
          ? "No se pudo cargar el catálogo de tipos."
          : (errorMessage ?? "")
      }
    >
      {disponibles.map((tipo) => (
        <ListBox.Item
          key={tipo.id}
          id={String(tipo.id)}
          textValue={tipo.nombre}
        >
          {tipo.nombre}
          {tipo.activo ? "" : " (inactivo)"}
        </ListBox.Item>
      ))}
    </SelectedField>
  );
}
