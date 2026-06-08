import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Tooltip } from "@heroui/react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { listHabilidades, deleteHabilidad } from "@modules/empleados/api/habilidadesApi";
import { ModalHabilidad } from "@modules/empleados/components/ModalHabilidad";
import type { Habilidad } from "@modules/empleados/types/habilidad";

export const Route = createFileRoute("/_authenticated/empleados/habilidades")({
  component: HabilidadesCatalogoPage,
});

function HabilidadesCatalogoPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onOpenChange = (open: boolean) => setIsOpen(open);
  const [selectedHabilidad, setSelectedHabilidad] = useState<Habilidad | null>(null);

  // TanStack Query para listar
  const { data: habilidades = [], isLoading } = useQuery({
    queryKey: ["habilidades"],
    queryFn: listHabilidades,
  });

  // Mutación para borrar
  const deleteMutation = useMutation({
    mutationFn: deleteHabilidad,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habilidades"] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Error al eliminar la habilidad.");
    }
  });

  const handleEdit = (habilidad: Habilidad) => {
    setSelectedHabilidad(habilidad);
    onOpen();
  };

  const handleCreate = () => {
    setSelectedHabilidad(null);
    onOpen();
  };

  return (
    <div className="p-6 flex flex-col gap-4 w-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Catálogo de Habilidades</h1>
          <p className="text-sm text-slate-500">Estandarización de competencias para los empleados</p>
        </div>
        <Button color="primary" endContent={<Plus size={18} />} onPress={handleCreate}>
          Nueva Habilidad
        </Button>
      </div>

      <Table aria-label="Tabla de habilidades" isLoading={isLoading}>
        <TableHeader>
          <TableColumn>NOMBRE</TableColumn>
          <TableColumn>DESCRIPCIÓN</TableColumn>
          <TableColumn align="center">ACCIONES</TableColumn>
        </TableHeader>
        <TableBody emptyContent={"No hay habilidades registradas."}>
          {habilidades.map((hab) => (
            <TableRow key={hab.id}>
              <TableCell className="font-semibold">{hab.nombre}</TableCell>
              <TableCell>{hab.descripcion || <span className="text-slate-400 italic">Sin descripción</span>}</TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  <Tooltip content="Editar habilidad">
                    <Button isIconOnly size="sm" variant="light" onPress={() => handleEdit(hab)}>
                      <Edit2 size={16} className="text-default-400" />
                    </Button>
                  </Tooltip>
                  <Tooltip color="danger" content="Eliminar (Solo si no está asignada a activos)">
                    <Button 
                      isIconOnly 
                      size="sm" 
                      variant="light" 
                      onPress={() => {
                        if(confirm(`¿Deseas eliminar la habilidad "${hab.nombre}"?`)) {
                          deleteMutation.mutate(hab.id);
                        }
                      }}
                    >
                      <Trash2 size={16} className="text-danger" />
                    </Button>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ModalHabilidad 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        habilidad={selectedHabilidad} 
      />
    </div>
  );
}