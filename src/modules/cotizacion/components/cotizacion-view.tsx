import { Card } from "@heroui/react";
import { Table } from "@heroui/react/table";
import { Button } from "@heroui/react/button";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, FileText, Printer } from "lucide-react";
import type { CotizacionDetalle } from "../types/cotizacion";
import { CotizacionPrintTemplate } from "./cotizacion-print-emplate";

interface Props {
  cotizacion: CotizacionDetalle;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-SV");
}

function money(value: string) {
  return `$${Number(value).toFixed(2)}`;
}

export function CotizacionView({ cotizacion }: Props) {
  function handlePrint() {
    window.print();
  }
return (
  <>
    <div className="flex w-full flex-col gap-4 print:hidden">
      <div className="flex justify-between">
        <Link to="/cotizaciones">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1" />
            Volver
          </Button>
        </Link>

        <Button size="sm" onClick={handlePrint}>
          <Printer className="mr-1" />
          Imprimir
        </Button>
      </div>

      <Card className="w-full" variant="transparent">
        <Card.Header className="font-medium text-lg flex flex-row items-center gap-2">
          <FileText className="text-muted inline" />
          Detalle de cotización
        </Card.Header>

        <Card.Content className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">Cliente</p>
              <p className="font-medium">{cotizacion.cliente}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Estado</p>
              <p className="font-medium">
                {cotizacion.estado === "ACTIVA"
                  ? "Activa"
                  : "Desactivada"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Descripción</p>
              <p className="font-medium">{cotizacion.descripcion}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Creada por</p>
              <p className="font-medium">
                {cotizacion.user.name} {cotizacion.user.lastName}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Teléfono</p>
              <p className="font-medium">{cotizacion.phone}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{cotizacion.email}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Fecha de creación</p>
              <p className="font-medium">
                {formatDate(cotizacion.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Última actualización</p>
              <p className="font-medium">
                {formatDate(cotizacion.updatedAt)}
              </p>
            </div>
          </div>

          <Table>
            <Table.ScrollContainer>
              <Table.Content
                aria-label="Materiales de cotización"
                className="min-w-full"
              >
                <Table.Header>
                  <Table.Column>Material</Table.Column>
                  <Table.Column>Descripción</Table.Column>
                  <Table.Column>Unidad</Table.Column>
                  <Table.Column>Cantidad</Table.Column>
                  <Table.Column>Costo unitario</Table.Column>
                  <Table.Column>Subtotal</Table.Column>
                  <Table.Column>IVA</Table.Column>
                  <Table.Column>Total</Table.Column>
                </Table.Header>

                <Table.Body>
                  <Table.Collection items={cotizacion.detalles}>
                    {(detalle) => (
                      <Table.Row key={detalle.id}>
                        <Table.Cell>{detalle.material.nombre}</Table.Cell>

                        <Table.Cell>
                          {detalle.material.descripcion ??
                            "Sin descripción"}
                        </Table.Cell>

                        <Table.Cell>{detalle.unidad}</Table.Cell>

                        <Table.Cell>
                          {Number(detalle.cantidad)}
                        </Table.Cell>

                        <Table.Cell>
                          {money(detalle.costoUnitario)}
                        </Table.Cell>

                        <Table.Cell>
                          {money(detalle.subTotal)}
                        </Table.Cell>

                        <Table.Cell>
                          {money(detalle.totalIva)}
                        </Table.Cell>

                        <Table.Cell>
                          {money(detalle.total)}
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Collection>
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>

          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2 rounded-lg border p-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <strong>{money(cotizacion.subTotal)}</strong>
              </div>

              <div className="flex justify-between">
                <span>IVA</span>
                <strong>{money(cotizacion.totalIva)}</strong>
              </div>

              <div className="flex justify-between text-lg">
                <span>Total</span>
                <strong>{money(cotizacion.total)}</strong>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>

    <CotizacionPrintTemplate cotizacion={cotizacion} />
  </>
);
}