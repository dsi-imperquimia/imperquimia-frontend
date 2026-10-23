import { InputField } from "@components/fields/InputField";
import { Button, Modal } from "@heroui/react";
import { useState } from "react";
import type { Material } from "@modules/materiales/types/material";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  materiales: Material[];
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
  selectedIds: Set<number>;
  onAdd: (materialId: number) => void;
}

function searchable(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function MaterialPickerModal({
  isOpen,
  onOpenChange,
  materiales,
  isLoading,
  hasError,
  onRetry,
  selectedIds,
  onAdd,
}: Props) {
  const [search, setSearch] = useState("");
  const query = searchable(search.trim());
  const disponibles = materiales.filter(
    (material) => material.estado && !selectedIds.has(material.id),
  );
  const resultados = disponibles.filter((material) =>
    searchable(
      [material.codigo, material.nombre, material.descripcion, material.unidad]
        .filter(Boolean)
        .join(" "),
    ).includes(query),
  );

  function handleOpenChange(open: boolean) {
    onOpenChange(open);
    if (!open) setSearch("");
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="w-full sm:max-w-3xl">
            <Modal.Header>
              <Modal.Heading>Agregar materiales</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="max-h-[70vh] overflow-y-auto">
              <InputField
                label="Buscar materiales"
                type="search"
                placeholder="Busca por nombre, código o descripción"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              {isLoading ? (
                <p className="py-6 text-center text-sm text-gray-500">
                  Cargando materiales...
                </p>
              ) : hasError ? (
                <div className="space-y-3 py-6 text-center">
                  <p className="text-sm text-red-600" role="alert">
                    No se pudieron cargar los materiales.
                  </p>
                  <Button type="button" variant="secondary" onClick={onRetry}>
                    Reintentar
                  </Button>
                </div>
              ) : resultados.length > 0 ? (
                <table className="w-full table-fixed text-sm max-md:block">
                  <thead className="border-b text-left text-gray-600 max-md:hidden">
                    <tr>
                      <th scope="col" className="w-[8%] px-2 py-3">
                        ID
                      </th>
                      <th scope="col" className="w-[23%] px-2 py-3">
                        Nombre
                      </th>
                      <th scope="col" className="w-[32%] px-2 py-3">
                        Descripción
                      </th>
                      <th scope="col" className="w-[12%] px-2 py-3">
                        Unidad
                      </th>
                      <th scope="col" className="w-[15%] px-2 py-3 text-right">
                        Precio
                      </th>
                      <th scope="col" className="w-[10%] px-2 py-3 text-right">
                        Agregar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="block divide-y divide-gray-200 md:table-row-group">
                    {resultados.map((material) => (
                      <tr
                        key={material.id}
                        className="grid grid-cols-2 gap-2 py-3 md:table-row md:py-0"
                      >
                        <td className="min-w-0 px-2 text-xs text-gray-500 md:table-cell md:py-3">
                          <span className="md:hidden">ID: </span>
                          {material.id}
                        </td>
                        <th
                          scope="row"
                          className="col-span-2 min-w-0 px-2 text-left font-medium md:table-cell md:py-3"
                        >
                          {material.nombre}
                          {material.codigo && (
                            <span className="block text-xs font-normal text-gray-500">
                              {material.codigo}
                            </span>
                          )}
                        </th>
                        <td className="col-span-2 min-w-0 break-words px-2 text-gray-600 md:table-cell md:py-3">
                          {material.descripcion || "—"}
                        </td>
                        <td className="min-w-0 px-2 md:table-cell md:py-3">
                          {material.unidad}
                        </td>
                        <td className="min-w-0 px-2 text-right md:table-cell md:py-3">
                          ${Number(material.costoUnitario).toFixed(2)}
                        </td>
                        <td className="col-span-2 px-2 text-right md:table-cell md:py-3">
                          <Button
                            type="button"
                            size="sm"
                            aria-label={`Agregar ${material.nombre}`}
                            onClick={() => onAdd(material.id)}
                          >
                            +
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="py-6 text-center text-sm text-gray-500">
                  {disponibles.length === 0
                    ? "No hay más materiales disponibles."
                    : "No se encontraron materiales con esa búsqueda."}
                </p>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
              >
                Cerrar
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
