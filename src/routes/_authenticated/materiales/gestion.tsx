/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { InputField } from "@components/fields/InputField";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { listMateriales } from "@modules/materiales/api/list-materiales";
import { storeMaterial } from "@modules/materiales/api/store-material";
import { parseErrorApiUseForm } from "@modules/core/utils/parseErrorApi";
import type { Material } from "@modules/materiales/types/material";
import {
  filtrarMateriales,
  getEstadoMaterialLabel,
  isMaterialDisponible,
} from "@modules/materiales/components/materiales-utils";
import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  DollarSign,
  FileText,
  Link2,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Ruler,
  Search,
  Tag,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/materiales/gestion")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState("");
  const [editingMaterial, setEditingMaterial] = useState<
    Partial<Material> | null
  >(null);
  const [showForm, setShowForm] = useState(false);

  const {
    data = [],
    isPending,
    error,
    refetch,
    isRefetching,
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

  function handleNew() {
    setEditingMaterial(null);
    setShowForm(true);
  }

  function handleEdit(material: Material) {
    setEditingMaterial(material);
    setShowForm(true);
  }

  function handleCloseForm() {
    setEditingMaterial(null);
    setShowForm(false);
  }

  async function handleToggleEstado(material: Material) {
    try {
      await storeMaterial({ id: material.id, estado: !material.estado });
      toast.success(
        material.estado
          ? `"${material.nombre}" desactivado`
          : `"${material.nombre}" activado`,
      );
      queryClient.invalidateQueries({ queryKey: ["materiales"] });
    } catch {
      toast.danger("Error al cambiar el estado del material.");
    }
  }

  const resultados = filtrarMateriales(data, busqueda);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de materiales
          </h1>
          <p className="text-sm text-gray-500">
            Agrega, edita y administra los materiales del catálogo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            isIconOnly
            onClick={() => refetch()}
            isDisabled={isPending || isRefetching}
            isPending={isRefetching}
          >
            <RefreshCw className={isRefetching ? "animate-spin" : ""} />
          </Button>
          <Button onClick={handleNew}>
            <Plus className="mr-1 size-4" />
            Nuevo material
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
        {/* Lista de materiales */}
        <section className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="buscar-material-gestion"
            >
              Buscar por nombre, código o descripción
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 focus-within:border-gray-400">
              <Search className="size-4 text-gray-400" />
              <input
                id="buscar-material-gestion"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Ej. MAT-0001, cemento, varilla..."
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Catálogo de materiales
                </h2>
                <p className="text-sm text-gray-500">
                  {resultados.length} material(es)
                </p>
              </div>
              <Package className="size-5 text-gray-400" />
            </div>

            {isPending ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Cargando materiales...
              </div>
            ) : resultados.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                {busqueda.trim()
                  ? "No se encontraron materiales con ese criterio."
                  : "No hay materiales registrados. Comienza agregando uno."}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {resultados.map((material) => {
                  const disponible = isMaterialDisponible(material);

                  return (
                    <article
                      key={material.id}
                      className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {material.nombre}
                          </h3>
                          {material.codigo && (
                            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                              {material.codigo}
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                              disponible
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {disponible ? (
                              <CheckCircle2 className="size-3" />
                            ) : (
                              <XCircle className="size-3" />
                            )}
                            {getEstadoMaterialLabel(material.estado)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                          <span>
                            {material.descripcion || "Sin descripción"}
                          </span>
                          <span className="font-medium">
                            Unidad: {material.unidad}
                          </span>
                          <span className="font-medium">
                            ${Number(material.costoUnitario).toFixed(2)}
                          </span>
                          {material.fichaTecnica && (
                            <a
                              href={material.fichaTecnica}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <FileText className="size-3" />
                              Ficha técnica
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(material)}
                        >
                          <Pencil className="mr-1 size-3" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant={disponible ? "danger-soft" : "outline"}
                          onClick={() => handleToggleEstado(material)}
                        >
                          {disponible ? "Desactivar" : "Activar"}
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Formulario lateral */}
        {showForm && (
          <aside className="h-fit rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h2 className="font-semibold text-gray-900">
                {editingMaterial ? "Editar material" : "Nuevo material"}
              </h2>
              <Button
                size="sm"
                variant="ghost"
                isIconOnly
                onClick={handleCloseForm}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="p-4">
              <MaterialForm
                material={editingMaterial ?? undefined}
                onSuccess={() => {
                  handleCloseForm();
                  queryClient.invalidateQueries({ queryKey: ["materiales"] });
                }}
              />
            </div>
          </aside>
        )}
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
