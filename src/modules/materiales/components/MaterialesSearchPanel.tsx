import { Card } from "@heroui/react/card";
import { Chip } from "@heroui/react/chip";
import { Label } from "@heroui/react/label";
import { Link } from "@heroui/react/link";
import { SearchField } from "@heroui/react/search-field";
import { Spinner } from "@heroui/react/spinner";
import { Table } from "@heroui/react/table";
import { CheckCircle2, PackageSearch, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import type { Material } from "../types/material";
import {
  filtrarMateriales,
  getEstadoMaterialLabel,
  isMaterialDisponible,
} from "./materiales-utils";

interface Props {
  materiales: Material[];
  busqueda: string;
  onBusquedaChange: (value: string) => void;
  isPending?: boolean;
  renderAction?: (material: Material) => ReactNode;
}

export function MaterialesSearchPanel({
  materiales,
  busqueda,
  onBusquedaChange,
  isPending = false,
  renderAction,
}: Props) {
  const resultados = filtrarMateriales(materiales, busqueda);
  const hasSearch = busqueda.trim().length > 0;

  return (
    <section className="space-y-4">
      <Card>
        <Card.Content>
          <SearchField
            fullWidth
            name="buscar-material"
            value={busqueda}
            onChange={onBusquedaChange}
            variant="secondary"
          >
            <Label>Buscar por nombre, código o descripción</Label>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Ej. MAT-0001, cemento, varilla..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </Card.Content>
      </Card>

      <div>
        <div className="flex items-center justify-between py-3">
          <div>
            <h2 className="text-base font-semibold">Resultados</h2>
            <p className="text-sm text-muted">
              {resultados.length} material(es) encontrado(s)
            </p>
          </div>
          <PackageSearch className="size-5 text-muted" />
        </div>

        {isPending ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
            <Spinner size="sm" />
            Cargando materiales...
          </div>
        ) : resultados.length === 0 && hasSearch ? (
          <div className="py-8 text-center text-sm italic text-muted">
            Material no encontrado, contacte a bodega.
          </div>
        ) : resultados.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted">
            No hay materiales registrados.
          </div>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Materiales" className="min-w-[760px]">
                <Table.Header>
                  <Table.Column isRowHeader>Material</Table.Column>
                  <Table.Column>Descripción</Table.Column>
                  <Table.Column>Unidad</Table.Column>
                  <Table.Column>Precio</Table.Column>
                  {renderAction && <Table.Column>Acciones</Table.Column>}
                </Table.Header>
                <Table.Body>
                  <Table.Collection items={resultados}>
                    {(material) => {
                      const disponible = isMaterialDisponible(material);
                      return (
                        <Table.Row key={material.id}>
                          <Table.Cell>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">
                                {material.nombre}
                              </span>
                              {material.codigo && (
                                <Chip size="sm">{material.codigo}</Chip>
                              )}
                              <Chip
                                size="sm"
                                variant="soft"
                                color={disponible ? "success" : "danger"}
                              >
                                {disponible ? (
                                  <CheckCircle2 className="size-3" />
                                ) : (
                                  <XCircle className="size-3" />
                                )}
                                <Chip.Label>
                                  {getEstadoMaterialLabel(material.estado)}
                                </Chip.Label>
                              </Chip>
                            </div>
                            {material.fichaTecnica && (
                              <Link
                                href={material.fichaTecnica}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 text-sm"
                              >
                                Ficha técnica
                              </Link>
                            )}
                          </Table.Cell>
                          <Table.Cell>
                            {material.descripcion || "Sin descripción"}
                          </Table.Cell>
                          <Table.Cell>{material.unidad}</Table.Cell>
                          <Table.Cell>
                            ${Number(material.costoUnitario).toFixed(2)}
                          </Table.Cell>
                          {renderAction && (
                            <Table.Cell>{renderAction(material)}</Table.Cell>
                          )}
                        </Table.Row>
                      );
                    }}
                  </Table.Collection>
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </div>
    </section>
  );
}
