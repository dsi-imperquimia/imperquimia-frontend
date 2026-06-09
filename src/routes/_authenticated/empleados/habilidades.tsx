import { useState, useEffect } from "react";
import { Spinner, toast } from "@heroui/react";
import { Button } from "@heroui/react/button";
import { Table } from "@heroui/react/table";
import { cn } from "@modules/core/utils/utils";
import { listHabilidades, deleteHabilidad } from "@modules/empleados/api/habilidadesApi";
import { ModalHabilidad } from "@modules/empleados/components/ModalHabilidad";
import type { Habilidad } from "@modules/empleados/types/habilidad";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Edit2, Plus, RefreshCw, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/empleados/habilidades")({
  component: HabilidadesCatalogoComponent,
});

function HabilidadesCatalogoComponent() {
  const queryClient = useQueryClient();
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [habilidadSeleccionada, setHabilidadSeleccionada] = useState<Habilidad | null>(null);

  const { data: habilidades = [], isPending, error, refetch, isRefetching } = useQuery<Habilidad[]>({
    queryKey: ["habilidades"],
    queryFn: listHabilidades,
    retry: false, // 👈 Evita reintentos infinitos si el backend está caído o roto
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHabilidad,
    onSuccess: () => {
      toast.success("Habilidad eliminada del catálogo");
      queryClient.invalidateQueries({ queryKey: ["habilidades"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "No se pudo eliminar. Verifique si está asignada a empleados activos.";
      toast.danger(msg);
    },
  });

  const handleCreate = () => {
    setHabilidadSeleccionada(null);
    setIsOpenModal(true);
  };

  const handleEdit = (habilidad: Habilidad) => {
    setHabilidadSeleccionada(habilidad);
    setIsOpenModal(true);
  };

  useEffect(() => {
    if (error) {
      toast.danger("Error al recuperar el catálogo de habilidades.");
    }
  }, [error]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de Habilidades</h1>
          <p className="text-sm text-gray-500">Estandarice las opciones disponibles para los perfiles del sistema.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            isIconOnly
            onClick={() => refetch()}
            isDisabled={isPending || isRefetching}
          >
            <RefreshCw className={cn(isRefetching && "animate-spin")} size={16} />
          </Button>
          <Button onClick={handleCreate} className="bg-gray-900 text-white font-medium">
            <Plus size={16} className="mr-1" />
            Nueva Habilidad
          </Button>
        </div>
      </div>

      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Catálogo de Habilidades" className="min-w-full">
            <Table.Header>
              <Table.Column isRowHeader>Nombre de la Habilidad</Table.Column>
              <Table.Column>Descripción</Table.Column>
              <Table.Column className="text-right">Acciones</Table.Column>
            </Table.Header>
            <Table.Body>
              {isPending && (
                <Table.LoadMore isLoading={isPending}>
                  <Table.LoadMoreContent>
                    <Spinner size="sm" />
                  </Table.LoadMoreContent>
                </Table.LoadMore>
              )}
              <Table.Collection items={habilidades}>
                {(hab) => (
                  <Table.Row key={hab.id}>
                    <Table.Cell className="font-semibold text-gray-800">{hab.nombre}</Table.Cell>
                    <Table.Cell className="text-gray-500">{hab.descripcion || "—"}</Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2 justify-end">
                        <Button size="sm" variant="ghost" isIconOnly onClick={() => handleEdit(hab)}>
                          <Edit2 size={14} />
                        </Button>
                        <Button size="sm" variant="danger" isIconOnly onClick={() => {
                            if(confirm(`¿Desea eliminar la habilidad "${hab.nombre}"?`)) {
                              deleteMutation.mutate(hab.id);
                            }
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Collection>
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      <ModalHabilidad 
        isOpen={isOpenModal} 
        onOpenChange={setIsOpenModal} 
        habilidad={habilidadSeleccionada} 
      />
    </>
  );
}