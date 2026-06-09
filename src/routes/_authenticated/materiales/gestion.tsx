/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { InputField } from "@components/fields/InputField";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { listMateriales } from "@modules/materiales/api/list-materiales";
import { storeMaterial } from "@modules/materiales/api/store-material";
import { parseErrorApiUseForm } from "@modules/core/utils/parseErrorApi";
import type { Material } from "@modules/materiales/types/material";
import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  DollarSign,
  FileText,
  Link2,
  Package,
  Ruler,
  Tag,
  ArrowLeft,
} from "lucide-react";
import { useEffect } from "react";

type MaterialesGestionSearch = {
  id?: number;
};

export const Route = createFileRoute("/_authenticated/materiales/gestion")({
  validateSearch: (search: Record<string, unknown>): MaterialesGestionSearch => {
    return {
      id: search.id ? Number(search.id) : undefined,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = Route.useSearch();

  const {
    data: materiales = [],
    isPending,
    error,
  } = useQuery<Material[]>({
    queryKey: ["materiales"],
    queryFn: listMateriales,
  });

  useEffect(() => {
    if (!error) return;
    toast.danger(
      "Error al cargar los materiales. Por favor, inténtalo de nuevo.",
    );
  }, [error]);

  const editingMaterial = id ? materiales.find((m) => m.id === id) : null;

  if (isPending) {
    return <div className="p-4 text-center text-gray-500">Cargando datos...</div>;
  }

  if (id && !editingMaterial) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate({ to: "/materiales" })}>
          <ArrowLeft className="mr-2 size-4" /> Volver
        </Button>
        <div className="p-4 text-center text-gray-500">Material no encontrado.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" isIconOnly onClick={() => navigate({ to: "/materiales" })}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {editingMaterial ? "Editar material" : "Nuevo material"}
          </h1>
          <p className="text-sm text-gray-500">
            {editingMaterial
              ? "Modifica los detalles del material seleccionado."
              : "Ingresa la información para registrar un nuevo material."}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <MaterialForm
          key={editingMaterial?.id ?? "new"}
          material={editingMaterial ?? undefined}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["materiales"] });
            navigate({ to: "/materiales" });
          }}
        />
      </div>
    </div>
  );
}

/* ─── Formulario de material ─── */

interface FormProps {
  material?: Partial<Material>;
  onSuccess: () => void;
}

function MaterialForm({ material: materialInit, onSuccess }: FormProps) {
  const isEdit = Boolean(materialInit?.id);

  const form = useForm({
    defaultValues: {
      nombre: materialInit?.nombre ?? "",
      descripcion: materialInit?.descripcion ?? "",
      unidad: materialInit?.unidad ?? "",
      costoUnitario: materialInit?.costoUnitario ?? 0,
      codigo: materialInit?.codigo ?? "",
      fichaTecnica: materialInit?.fichaTecnica ?? "",
      estado: materialInit?.estado ?? true,
    },
    onSubmit: async ({ value, formApi }) => {
      const payload: Partial<Material> = {
        ...value,
        costoUnitario: Number(value.costoUnitario),
        descripcion: value.descripcion || undefined,
        codigo: value.codigo || undefined,
        fichaTecnica: value.fichaTecnica || undefined,
      };

      if (isEdit && materialInit?.id) {
        payload.id = materialInit.id;
      }

      await storeMaterial(payload).catch((error) => {
        formApi.setErrorMap(
          parseErrorApiUseForm(error, "Error al guardar material"),
        );
        throw error;
      });

      toast.success(
        isEdit
          ? "Material actualizado correctamente"
          : "Material creado correctamente",
      );
      onSuccess();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      autoComplete="off"
      data-1p-ignore
    >
      <form.Field
        name="nombre"
        validators={{
          onChange: ({ value }) => {
            if (!value) return "El nombre es requerido";
            if (value.length < 2) return "Mínimo 2 caracteres";
            return undefined;
          },
        }}
      >
        {(field) => (
          <InputField
            label="Nombre"
            type="text"
            placeholder="Ej. Cemento Portland"
            startContent={<Package className="size-4 text-muted" />}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            autoComplete="off"
            data-1p-ignore
            errorMessage={
              field.state.meta.errors.length > 0
                ? field.state.meta.errors.join(", ")
                : undefined
            }
          />
        )}
      </form.Field>

      <form.Field name="descripcion">
        {(field) => (
          <InputField
            label="Descripción"
            type="text"
            placeholder="Descripción opcional del material"
            startContent={<FileText className="size-4 text-muted" />}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            autoComplete="off"
            data-1p-ignore
          />
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-3">
        <form.Field
          name="unidad"
          validators={{
            onChange: ({ value }) => {
              if (!value) return "La unidad es requerida";
              return undefined;
            },
          }}
        >
          {(field) => (
            <InputField
              label="Unidad"
              type="text"
              placeholder="Ej. kg, m², litro"
              startContent={<Ruler className="size-4 text-muted" />}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              autoComplete="off"
              data-1p-ignore
              errorMessage={
                field.state.meta.errors.length > 0
                  ? field.state.meta.errors.join(", ")
                  : undefined
              }
            />
          )}
        </form.Field>

        <form.Field
          name="costoUnitario"
          validators={{
            onChange: ({ value }) => {
              if (Number(value) < 0) return "El costo no puede ser negativo";
              return undefined;
            },
          }}
        >
          {(field) => (
            <InputField
              label="Costo unitario"
              type="number"
              placeholder="0.00"
              startContent={<DollarSign className="size-4 text-muted" />}
              value={String(field.state.value)}
              onChange={(e) => field.handleChange(Number(e.target.value))}
              onBlur={field.handleBlur}
              autoComplete="off"
              data-1p-ignore
              errorMessage={
                field.state.meta.errors.length > 0
                  ? field.state.meta.errors.join(", ")
                  : undefined
              }
            />
          )}
        </form.Field>
      </div>

      <form.Field name="codigo">
        {(field) => (
          <InputField
            label="Código"
            type="text"
            placeholder="Se genera automáticamente si se deja vacío"
            startContent={<Tag className="size-4 text-muted" />}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            autoComplete="off"
            data-1p-ignore
          />
        )}
      </form.Field>

      <form.Field name="fichaTecnica">
        {(field) => (
          <InputField
            label="Ficha técnica (enlace)"
            type="url"
            placeholder="https://ejemplo.com/ficha.pdf"
            startContent={<Link2 className="size-4 text-muted" />}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            autoComplete="off"
            data-1p-ignore
          />
        )}
      </form.Field>

      <form.Field name="estado">
        {(field) => (
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(field.state.value)}
              onChange={(e) => field.handleChange(e.target.checked)}
              onBlur={field.handleBlur}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
            />
            <span>Material activo</span>
          </label>
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          isSubmitting: state.isSubmitting,
          errorMap: state.errorMap,
        })}
        children={({ canSubmit, isSubmitting, errorMap }) => {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          const error = errorMap.onSubmit || errorMap.onServer;
          return (
            <>
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {typeof error === "string" ? error : "Error al guardar"}
                </p>
              )}
              <Button
                type="submit"
                isDisabled={!canSubmit}
                isPending={isSubmitting}
                className="bg-gray-900"
              >
                {isSubmitting
                  ? "Guardando..."
                  : isEdit
                    ? "Actualizar material"
                    : "Crear material"}
              </Button>
            </>
          );
        }}
      />
    </form>
  );
}
