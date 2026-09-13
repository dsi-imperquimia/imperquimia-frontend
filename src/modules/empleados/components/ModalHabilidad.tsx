import { Button, Input, Modal, TextArea } from "@heroui/react"; // 👈 Regresamos a TextArea con 'A' mayúscula
import { toast } from "@heroui/react/toast";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createHabilidad, updateHabilidad } from "../api/habilidadesApi";
import type { Habilidad } from "../types/habilidad";

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
      toast.success(
        habilidad ? "Habilidad actualizada" : "Habilidad creada con éxito",
      );
      queryClient.invalidateQueries({ queryKey: ["habilidades"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.danger(
        error.response?.data?.message || "Ocurrió un error con el catálogo.",
      );
    },
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
                className="flex flex-col gap-4"
              >
                {/* Campo Nombre */}
                <form.Field
                  name="nombre"
                  validators={{
                    onChange: ({ value }) =>
                      !value ? "El nombre es obligatorio" : undefined,
                  }}
                >
                  {(field) => (
                    <div>
                      <Input
                        className="w-full"
                        placeholder="Nombre de la Habilidad"
                        type="text"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)} // 👈 Uso de onChange nativo para evitar conflictos
                      />
                      {field.state.meta.errors.length > 0 && (
                        <span className="text-xs text-red-500 mt-1 block">
                          {field.state.meta.errors.join(", ")}
                        </span>
                      )}
                    </div>
                  )}
                </form.Field>

                {/* Campo Descripción */}
                <form.Field name="descripcion">
                  {(field) => (
                    <TextArea
                      className="h-32 w-full"
                      placeholder="Descripción (Opcional)"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)} // 👈 Sincronizado nativamente
                    />
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
                isPending={mutation.isPending} // 👈 Regresamos a isPending que es el correcto en tu diseño
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
