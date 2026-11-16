import { TextAreaField } from "@components/fields/TextAreaField";
import { AlertDialog } from "@heroui/react/alert-dialog";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Table } from "@heroui/react/table";
import { toast } from "@heroui/react/toast";
import { nuevaClaveOperacion as nuevaClave } from "@lib/uuid";
import { userActions } from "@modules/auth/store/authStore";
import { DevolverMaterialesProyectoModal } from "@modules/materiales/components/DevolverMaterialesProyectoModal";
import { EnviarMaterialesProyectoModal } from "@modules/materiales/components/EnviarMaterialesProyectoModal";
import type { ProyectoDetalle } from "@modules/proyectos/types/proyectos";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardPenLine,
  PackageSearch,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  errorConsumoMaterial,
  getConsumosProyecto,
  revertirConsumoMaterial,
} from "../api/consumos-materiales";
import type {
  ConsumoMaterial,
  ResumenMaterialProyecto,
} from "../types/consumo-material";
import { DescargarReporteConsumosModal } from "./DescargarReporteConsumosModal";
import { RegistrarConsumoModal } from "./RegistrarConsumoModal";

const numero = (value: string | number) =>
  Number(value).toLocaleString("es-SV", { maximumFractionDigits: 2 });
const fecha = (value: string) =>
  new Intl.DateTimeFormat("es-SV", { timeZone: "UTC" }).format(new Date(value));

function RevertirConsumoDialog({
  consumo,
  onSuccess,
}: {
  consumo: ConsumoMaterial;
  onSuccess: () => Promise<void>;
}) {
  const [motivo, setMotivo] = useState("");
  const [claveOperacion, setClaveOperacion] = useState(nuevaClave);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <AlertDialog isOpen={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline">
        Corregir
      </Button>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>Corregir consumo</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body className="space-y-4">
              <p>
                Se devolverán {numero(consumo.cantidad)}{" "}
                {consumo.material.unidad} al saldo del proyecto. El registro
                original quedará visible como anulado.
              </p>
              <TextAreaField
                label="Motivo de la corrección"
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                isRequired
              />
              {error && (
                <p className="text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary" isDisabled={pending}>
                Volver
              </Button>
              <Button
                variant="danger"
                isPending={pending}
                isDisabled={pending || motivo.trim().length < 3}
                onClick={async () => {
                  setPending(true);
                  setError("");
                  try {
                    await revertirConsumoMaterial(consumo.id, {
                      claveOperacion,
                      motivo: motivo.trim(),
                    });
                    await onSuccess();
                    toast.success("Consumo corregido");
                    setOpen(false);
                    setMotivo("");
                    setClaveOperacion(nuevaClave());
                  } catch (requestError) {
                    setError(errorConsumoMaterial(requestError));
                  } finally {
                    setPending(false);
                  }
                }}
              >
                Confirmar corrección
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

export function SeccionConsumosMateriales({
  proyecto,
  refetchProyecto,
}: {
  proyecto: ProyectoDetalle;
  refetchProyecto: () => Promise<unknown>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [envioOpen, setEnvioOpen] = useState(false);
  const [devolucionOpen, setDevolucionOpen] = useState(false);
  const client = useQueryClient();
  const puedeConsultar = userActions.hasPermission("CONSUMO_MATERIAL_READ");
  const puedeCrear = userActions.hasPermission("CONSUMO_MATERIAL_CREATE");
  const puedeEnviar = userActions.hasPermission("INVENTARIO_MATERIAL_EXIT");
  const puedeDevolver = userActions.hasPermission("INVENTARIO_MATERIAL_ENTRY");
  const puedeDescargarPdf = userActions.hasPermission("CONSUMO_REPORTE_PDF");
  const query = useQuery({
    queryKey: ["consumos-materiales", proyecto.id],
    queryFn: () => getConsumosProyecto(proyecto.id),
    enabled: puedeConsultar,
    retry: false,
  });

  useEffect(() => {
    if (!query.isError) return;
    toast.danger(errorConsumoMaterial(query.error), { timeout: 2000 });
  }, [query.error, query.isError]);

  async function actualizar() {
    await query.refetch();
    await client.invalidateQueries({ queryKey: ["inventario-materiales"] });
  }

  if (!puedeConsultar) return null;

  return (
    <>
      <Card className="w-full">
        <Card.Header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="flex items-center gap-2 text-lg font-medium">
              <PackageSearch className="text-muted inline size-5" />
              Materiales asignados al proyecto
            </span>
            <p className="mt-1 text-sm text-gray-500">
              Cotizado, movimientos, consumo real, merma y existencia actual.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Existencia actual = enviado al proyecto − devoluciones − consumo
              total.
            </p>
          </div>
          {proyecto.estado === "ACTIVO" && (
            <div className="flex flex-wrap gap-2">
              {puedeCrear && (
                <Button onClick={() => setModalOpen(true)}>
                  <ClipboardPenLine className="mr-1 size-4" />
                  Registrar consumo
                </Button>
              )}
              {puedeEnviar && (
                <Button variant="outline" onClick={() => setEnvioOpen(true)}>
                  <ArrowUpFromLine className="mr-1 size-4" />
                  Enviar materiales
                </Button>
              )}
              {puedeDevolver && (
                <Button
                  variant="outline"
                  onClick={() => setDevolucionOpen(true)}
                >
                  <ArrowDownToLine className="mr-1 size-4" />
                  Devolver materiales
                </Button>
              )}
            </div>
          )}
          {puedeDescargarPdf && (
            <DescargarReporteConsumosModal proyectoId={proyecto.id} />
          )}
        </Card.Header>
        <Card.Content>
          {query.isPending ? (
            <p role="status" className="text-gray-500">
              Cargando materiales del proyecto…
            </p>
          ) : query.isError ? (
            <div
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              role="alert"
            >
              {errorConsumoMaterial(query.error)}{" "}
              <Button
                size="sm"
                variant="outline"
                onClick={() => query.refetch()}
              >
                Reintentar
              </Button>
            </div>
          ) : (
            <>
              {query.data.resumen.length ? (
                <Table>
                  <Table.ScrollContainer>
                    <Table.Content
                      aria-label="Resumen de materiales del proyecto"
                      className="min-w-full"
                    >
                      <Table.Header>
                        <Table.Column isRowHeader>Material</Table.Column>
                        <Table.Column>Cotizado</Table.Column>
                        <Table.Column>Enviado</Table.Column>
                        <Table.Column>Devoluciones</Table.Column>
                        <Table.Column>Usado</Table.Column>
                        <Table.Column>Merma</Table.Column>
                        <Table.Column>Consumo total</Table.Column>
                        <Table.Column>Existencia actual</Table.Column>
                      </Table.Header>
                      <Table.Body>
                        <Table.Collection items={query.data.resumen}>
                          {(item: ResumenMaterialProyecto) => (
                            <Table.Row key={item.material.id}>
                              <Table.Cell>
                                <span className="font-medium">
                                  {item.material.nombre}
                                </span>
                                <span className="block text-xs text-gray-500">
                                  {item.material.unidad}
                                </span>
                              </Table.Cell>
                              <Table.Cell>
                                {numero(item.presupuestado)}
                              </Table.Cell>
                              <Table.Cell>{numero(item.entregado)}</Table.Cell>
                              <Table.Cell>{numero(item.devuelto)}</Table.Cell>
                              <Table.Cell>{numero(item.produccion)}</Table.Cell>
                              <Table.Cell>
                                <span
                                  className={
                                    Number(item.merma) > 0
                                      ? "font-medium text-amber-700"
                                      : ""
                                  }
                                >
                                  {numero(item.merma)}
                                </span>
                              </Table.Cell>
                              <Table.Cell className="font-medium">
                                {numero(item.consumido)}
                              </Table.Cell>
                              <Table.Cell className="font-semibold">
                                {numero(item.existenciaActual)}
                              </Table.Cell>
                            </Table.Row>
                          )}
                        </Table.Collection>
                      </Table.Body>
                    </Table.Content>
                  </Table.ScrollContainer>
                </Table>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <p className="text-gray-500">
                    Este proyecto no tiene materiales cotizados ni asignados.
                  </p>
                </div>
              )}

              <div className="mb-3 mt-6 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">Historial de consumo</h3>
              </div>
              {query.data.consumos.length ? (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <Table>
                    <Table.ScrollContainer>
                      <Table.Content
                        aria-label="Historial de consumo"
                        className="min-w-full"
                      >
                        <Table.Header>
                          <Table.Column isRowHeader>Jornada</Table.Column>
                          <Table.Column>Material</Table.Column>
                          <Table.Column>Tipo</Table.Column>
                          <Table.Column>Cantidad</Table.Column>
                          <Table.Column>Registrado por</Table.Column>
                          <Table.Column>Estado</Table.Column>
                          <Table.Column>Acción</Table.Column>
                        </Table.Header>
                        <Table.Body>
                          <Table.Collection items={query.data.consumos}>
                            {(consumo: ConsumoMaterial) => (
                              <Table.Row key={consumo.id}>
                                <Table.Cell>
                                  {fecha(consumo.fechaJornada)}
                                </Table.Cell>
                                <Table.Cell>
                                  <span className="font-medium">
                                    {consumo.material.nombre}
                                  </span>
                                  {consumo.motivo && (
                                    <span className="block max-w-xs text-xs text-gray-500">
                                      {consumo.motivo}
                                    </span>
                                  )}
                                </Table.Cell>
                                <Table.Cell>
                                  {consumo.clasificacion === "PERDIDA"
                                    ? "Merma"
                                    : consumo.clasificacion === "CIERRE"
                                      ? "Usado al cerrar"
                                      : "Usado"}
                                </Table.Cell>
                                <Table.Cell className="font-medium">
                                  {numero(consumo.cantidad)}{" "}
                                  {consumo.material.unidad}
                                </Table.Cell>
                                <Table.Cell>
                                  {consumo.usuario.name}{" "}
                                  {consumo.usuario.lastName}
                                </Table.Cell>
                                <Table.Cell>
                                  {consumo.anuladoAt ? (
                                    <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                                      Anulado
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                                      Aplicado
                                    </span>
                                  )}
                                </Table.Cell>
                                <Table.Cell>
                                  {puedeCrear &&
                                  proyecto.estado === "ACTIVO" &&
                                  !consumo.anuladoAt &&
                                  consumo.clasificacion !== "CIERRE" ? (
                                    <RevertirConsumoDialog
                                      consumo={consumo}
                                      onSuccess={actualizar}
                                    />
                                  ) : (
                                    "—"
                                  )}
                                </Table.Cell>
                              </Table.Row>
                            )}
                          </Table.Collection>
                        </Table.Body>
                      </Table.Content>
                    </Table.ScrollContainer>
                  </Table>
                </div>
              ) : (
                <p className="text-gray-500">
                  Todavía no hay consumos registrados.
                </p>
              )}

              <RegistrarConsumoModal
                proyectoId={proyecto.id}
                isOpen={modalOpen}
                onOpenChange={setModalOpen}
                resumen={query.data.resumen}
                onSuccess={actualizar}
              />
            </>
          )}
        </Card.Content>
      </Card>
      <EnviarMaterialesProyectoModal
        proyecto={proyecto}
        isOpen={envioOpen}
        onOpenChange={setEnvioOpen}
        onSuccess={async () => {
          await actualizar();
          await refetchProyecto();
        }}
      />
      <DevolverMaterialesProyectoModal
        proyecto={proyecto}
        resumen={query.data?.resumen ?? []}
        isOpen={devolucionOpen}
        onOpenChange={setDevolucionOpen}
        onSuccess={async () => {
          await actualizar();
          await refetchProyecto();
        }}
      />
    </>
  );
}
