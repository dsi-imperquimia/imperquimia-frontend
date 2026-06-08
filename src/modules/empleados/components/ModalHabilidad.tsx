import { Button, Input, TextArea, Modal } from "@heroui/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createHabilidad, updateHabilidad } from "../api/habilidadesApi";
import type { Habilidad } from "../types/habilidad";
import { useEffect } from "react";

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
      queryClient.invalidateQueries({ queryKey: ["habilidades"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Ocurrió un error en el catálogo.");
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
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange} 
      placement="top-center"
      title={habilidad ? "Editar Habilidad" : "Nueva Habilidad"}
      footer={
        <div className="flex gap-2 justify-end w-full">
          <Button color="danger" variant="flat" onPress={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button color="primary" type="submit" form="form-habilidad" isLoading={mutation.isPending}>
            Guardar
          </Button>
        </div>
      }
    >
      <form
        id="form-habilidad"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="flex flex-col gap-4 p-2"
      >
        <form.Field
          name="nombre"
          validators={{
            onChange: ({ value }) => !value ? "El nombre es obligatorio" : undefined
          }}
          children={(field) => (
            <Input
              label="Nombre de la Habilidad"
              variant="bordered"
              value={field.state.value}
              onValueChange={field.handleChange}
              isInvalid={!!field.state.meta.errors.length}
              errorMessage={field.state.meta.errors.join(", ")}
            />
          )}
        />

        <form.Field
          name="descripcion"
          children={(field) => (
            <TextArea
              label="Descripción (Opcional)"
              variant="bordered"
              value={field.state.value}
              onValueChange={field.handleChange}
            />
          )}
        />
      </form>
    </Modal>
  );
}