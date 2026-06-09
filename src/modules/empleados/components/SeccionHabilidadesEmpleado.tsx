import { Button, TextArea, Modal } from "@heroui/react";
import { InputField } from "@components/fields/InputField";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createHabilidad, updateHabilidad } from "../api/habilidadesApi";
import type { Habilidad } from "../types/habilidad";
import { useEffect } from "react";
import { toast } from "@heroui/react/toast";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  habilidad: Habilidad | null;
}

export function ModalHabilidad({ isOpen, onOpenChange, habilidad }: Props) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (values: { nombre: string; descripcion: string }) => {
      if (habilidad) {
        return updateHabilidad(habilidad.id, values);
      }
      return createHabilidad(values);
    },
    onSuccess: () => {
      toast.success(habilidad ? "Habilidad actualizada" : "Habilidad creada con éxito");
      queryClient.invalidateQueries({ queryKey: ["habilidades"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.danger(error.response?.data?.message || "Ocurrió un error con el catálogo.");
    }
  });

  const form = useForm({
    defaultValues: {
      nombre: "",
      descripcion: "",
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.setFieldValue("nombre", habilidad?.nombre ?? "");
      form.setFieldValue("descripcion", habilidad?.descripcion ?? "");
    }
  }, [habilidad, isOpen]);

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            
            <Modal.Header>
              <Modal.Heading>
                {habilidad ? "Editar Habilidad" : "Nueva Habilidad"}
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              <form
                id="form-habilidad"
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
                className="flex flex-col gap-4 py-2"
              >
                {/* Campo Nombre */}
                <form.Field
                  name="nombre"
                  validators={{
                    onChange: ({ value }) => !value ? "El nombre es obligatorio" : undefined
                  }}
                >
                  {(field) => (
                    <InputField
                      label="Nombre de la Habilidad"
                      type="text"
                      placeholder="Ej. NestJS, React, Liderazgo"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      errorMessage={
                        field.state.meta.errors.length > 0
                          ? field.state.meta.errors.join(", ")
                          : undefined
                      }
                    />
                  )}
                </form.Field>

                {/* Campo Descripción: Ajustado según la firma de tipos de tu HeroUI */}
                <form.Field name="descripcion">
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        Descripción (Opcional)
                      </label>
                      <TextArea
                        variant="secondary"
                        placeholder="Ingresa una breve descripción de la habilidad"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="min-h-[80px] w-full"
                      />
                    </div>
                  )}
                </form.Field>
              </form>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                form="form-habilidad" 
                isPending={mutation.isPending}
                className="bg-gray-900 text-white"
              >
                Guardar
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}