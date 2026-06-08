import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectItem, Button, Card, CardBody, Chip } from "@heroui/react";
import { ShieldCheck, Save } from "lucide-react";
import { listHabilidades, updateHabilidadesEmpleado } from "../api/api/habilidadesApi";
import type { Empleado } from "../types/empleado";

interface Props {
  empleado: Empleado;
}

export function SeccionHabilidadesEmpleado({ empleado }: Props) {
  const queryClient = useQueryClient();
  
  // Extraemos las IDs de habilidades que el empleado ya tiene asignadas actualmente
  const habilidadesIniciales = empleado.habilidades.map(h => h.habilidadId.toString());
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set(habilidadesIniciales));

  // Traer el catálogo de habilidades para el Dropdown (Criterio de aceptación 4 de PBI-88)
  const { data: catalogo = [] } = useQuery({
    queryKey: ["habilidades"],
    queryFn: listHabilidades,
  });

  const mutation = useMutation({
    mutationFn: (ids: number[]) => updateHabilidadesEmpleado(empleado.id, ids),
    onSuccess: () => {
      // Invalida la caché de este empleado específico para refrescar la UI de inmediato (PBI-90)
      queryClient.invalidateQueries({ queryKey: ["empleado", empleado.id] });
      alert("Habilidades actualizadas de inmediato.");
    },
    onError: () => {
      alert("No se pudieron actualizar las habilidades.");
    }
  });

  const handleSave = () => {
    const idsNumericos = Array.from(selectedKeys).map(id => Number(id));
    mutation.mutate(idsNumericos);
  };

  return (
    <Card className="shadow-sm border border-slate-100">
      <CardBody className="p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <ShieldCheck className="text-primary" size={20} />
            Habilidades Profesionales
          </h3>
          <p className="text-xs text-slate-400">Asigna y actualiza las destrezas de este perfil en tiempo real.</p>
        </div>

        {/* Multi-Select de HeroUI */}
        <Select
          label="Seleccionar Habilidades"
          selectionMode="multiple"
          placeholder="Seleccione una o varias habilidades..."
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          variant="bordered"
          className="w-full"
        >
          {catalogo.map((hab) => (
            <SelectItem key={hab.id} textValue={hab.nombre}>
              {hab.nombre}
            </SelectItem>
          ))}
        </Select>

        {/* Vista previa de asignadas actuales (PBI-89) */}
        <div className="flex flex-wrap gap-2 min-h-[40px] items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
          {empleado.habilidades.length === 0 ? (
            <span className="text-xs text-slate-400 italic">El empleado no tiene habilidades asignadas.</span>
          ) : (
            empleado.habilidades.map((eh) => (
              <Chip key={eh.habilidadId} variant="flat" color="secondary" size="sm">
                {eh.habilidad.nombre}
              </Chip>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <Button 
            color="primary" 
            size="sm"
            startContent={<Save size={16} />} 
            isLoading={mutation.isPending}
            onPress={handleSave}
          >
            Guardar Cambios
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}