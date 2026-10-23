import { useRef, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { InputField } from "@components/fields/InputField";
import { guardarProyecto, errorProyecto } from "../api/guardarProyecto";
import type { DatosProyecto, ErroresProyecto } from "../api/guardarProyecto";
import type { ProyectoDetalle } from "../types/proyectos";
import { dinero } from "../types/proyectos";
import { listMateriales } from "@modules/materiales/api/list-materiales";

function esFechaValida(fecha: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const parsed = new Date(fecha);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === fecha
  );
}

function enmascararTelefono(telefono: string) {
  if (/[^\d-]/.test(telefono)) return telefono;
  const digitos = telefono.replace(/\D/g, "").slice(0, 8);
  return digitos.length > 4
    ? `${digitos.slice(0, 4)}-${digitos.slice(4)}`
    : digitos;
}

type CampoDetalle = "materialId" | "cantidad";
const claveDetalle = (index: number, campo: CampoDetalle) =>
  `detalles.${index}.${campo}`;

function etiquetaDetalle(clave: string) {
  const match = /^detalles\.(\d+)\.(materialId|cantidad)$/.exec(clave);
  if (!match) return clave;
  const numeroMaterial = Number(match[1]) + 1;
  return match[2] === "materialId"
    ? `Material ${numeroMaterial}`
    : `Cantidad del material ${numeroMaterial}`;
}

export function FormProyecto({ proyecto }: { proyecto?: ProyectoDetalle }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [datos, setDatos] = useState<Omit<DatosProyecto, "detalles">>({
    nombre: proyecto?.nombre ?? "",
    cliente: proyecto?.cliente ?? "",
    descripcion: proyecto?.descripcion ?? "",
    ubicacion: proyecto?.ubicacion ?? "",
    phone: proyecto?.phone ?? "",
    email: proyecto?.email ?? "",
    fechaInicio: proyecto?.fechaInicio?.slice(0, 10) ?? "",
    fechaFin: proyecto?.fechaFin?.slice(0, 10) ?? "",
  });
  const [detalles, setDetalles] = useState(
    proyecto?.detalles.map((detalle) => ({
      materialId: String(detalle.material.id),
      cantidad: String(detalle.cantidad),
    })) ?? [],
  );
  const [error, setError] = useState("");
  const [erroresCampo, setErroresCampo] = useState<ErroresProyecto["campos"]>(
    {},
  );
  const [guardando, setGuardando] = useState(false);
  const erroresDetalle = Object.entries(erroresCampo).filter(([clave]) =>
    /^detalles\.\d+\.(materialId|cantidad)$/.test(clave),
  );
  const enfocarDetalle = (clave: string) => {
    const campo = formRef.current?.querySelector<HTMLElement>(
      `[data-campo="${clave}"] select, [data-campo="${clave}"] input`,
    );
    campo?.focus();
    if (campo && typeof campo.scrollIntoView === "function")
      campo.scrollIntoView({ block: "center", behavior: "smooth" });
  };
  const limpiarErrorDetalle = (index: number, campo: CampoDetalle) => {
    setErroresCampo((actuales) => {
      const siguientes = { ...actuales };
      delete siguientes[claveDetalle(index, campo)];
      delete siguientes.detalles;
      return siguientes;
    });
    setError("");
  };
  const limpiarErroresDetalle = () => {
    setErroresCampo((actuales) =>
      Object.fromEntries(
        Object.entries(actuales).filter(
          ([clave]) => clave !== "detalles" && !clave.startsWith("detalles."),
        ),
      ),
    );
    setError("");
  };
  const navigate = useNavigate();
  const client = useQueryClient();
  const materialesQuery = useQuery({
    queryKey: ["materiales"],
    queryFn: listMateriales,
  });
  const materiales = materialesQuery.data ?? [];
  const materialesElegibles = materiales.filter(
    (material) =>
      material.estado ||
      proyecto?.detalles.some((detalle) => detalle.material.id === material.id),
  );
  const resumen = detalles.reduce(
    (total, detalle) => {
      const id = Number(detalle.materialId);
      const anterior = proyecto?.detalles.find(
        (item) => item.material.id === id,
      );
      const material = materiales.find((item) => item.id === id);
      const cantidad = Number(detalle.cantidad);
      const costo = Number(
        anterior?.costoUnitario ?? material?.costoUnitario ?? 0,
      );
      const subtotal =
        Number.isFinite(cantidad) && cantidad > 0
          ? Math.round(cantidad * costo * 100) / 100
          : 0;
      const iva = Math.round(subtotal * 0.13 * 100) / 100;
      return {
        subTotal: total.subTotal + subtotal,
        totalIva: total.totalIva + iva,
      };
    },
    { subTotal: 0, totalIva: 0 },
  );
  const campos: {
    key: keyof Omit<DatosProyecto, "detalles">;
    label: string;
    type?: string;
    required?: boolean;
  }[] = [
    { key: "nombre", label: "Nombre", required: true },
    { key: "cliente", label: "Cliente", required: true },
    {
      key: "fechaInicio",
      label: "Fecha de inicio",
      type: "date",
      required: true,
    },
    { key: "fechaFin", label: "Fecha de fin", type: "date", required: true },
    { key: "phone", label: "Teléfono", type: "tel" },
    { key: "email", label: "Correo", type: "email" },
    { key: "ubicacion", label: "Ubicación" },
    { key: "descripcion", label: "Descripción" },
  ];
  return (
    <form
      ref={formRef}
      className="max-w-3xl space-y-5 rounded-xl border border-gray-200 bg-white p-6"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (guardando) return;
        setError("");
        setErroresCampo({});
        if (!datos.nombre.trim() || !datos.cliente.trim()) {
          setErroresCampo({
            ...(datos.nombre.trim()
              ? {}
              : { nombre: "Ingresa el nombre del proyecto." }),
            ...(datos.cliente.trim()
              ? {}
              : { cliente: "Ingresa el nombre del cliente." }),
          });
          setError("Completa el nombre del proyecto y el cliente.");
          return;
        }
        if (!datos.phone.trim() && !datos.email.trim()) {
          setErroresCampo({
            phone: "Ingresa un teléfono o correo.",
            email: "Ingresa un teléfono o correo.",
          });
          setError("Ingresa un teléfono o correo para continuar.");
          return;
        }

        const nuevosErrores: ErroresProyecto["campos"] = {};
        if (datos.phone.trim()) {
          if (/[^\d-]/.test(datos.phone)) {
            nuevosErrores.phone = "Usa solo números en el teléfono.";
          } else if (datos.phone.replace(/\D/g, "").length !== 8) {
            nuevosErrores.phone =
              "Ingresa los 8 dígitos del teléfono en formato ####-####.";
          }
        }
        if (!datos.fechaInicio) {
          nuevosErrores.fechaInicio = "Selecciona una fecha de inicio.";
        } else if (!esFechaValida(datos.fechaInicio)) {
          nuevosErrores.fechaInicio =
            "Ingresa una fecha de inicio válida en formato AAAA-MM-DD.";
        }
        if (!datos.fechaFin) {
          nuevosErrores.fechaFin = "Selecciona una fecha de fin.";
        } else if (!esFechaValida(datos.fechaFin)) {
          nuevosErrores.fechaFin =
            "Ingresa una fecha de fin válida en formato AAAA-MM-DD.";
        }
        if (
          !nuevosErrores.fechaInicio &&
          !nuevosErrores.fechaFin &&
          datos.fechaFin < datos.fechaInicio
        ) {
          nuevosErrores.fechaFin =
            "La fecha de fin debe ser igual o posterior a la fecha de inicio.";
        }
        const detallesPayload = detalles.map((detalle) => ({
          materialId: Number(detalle.materialId),
          cantidad: Number(detalle.cantidad),
        }));
        const materialesVistos = new Set<number>();
        detalles.forEach((detalle, index) => {
          const { materialId, cantidad } = detallesPayload[index];
          if (!Number.isInteger(materialId) || materialId <= 0) {
            nuevosErrores[claveDetalle(index, "materialId")] =
              "Selecciona un material.";
          } else if (materialesVistos.has(materialId)) {
            nuevosErrores[claveDetalle(index, "materialId")] =
              "Este material ya está agregado.";
          } else {
            materialesVistos.add(materialId);
          }
          if (
            !Number.isFinite(cantidad) ||
            cantidad <= 0 ||
            !/^\d+(?:\.\d{1,2})?$/.test(detalle.cantidad)
          ) {
            nuevosErrores[claveDetalle(index, "cantidad")] =
              "Ingresa una cantidad mayor que cero, con hasta dos decimales.";
          }
        });
        if (Object.keys(nuevosErrores).length > 0) {
          setErroresCampo(nuevosErrores);
          setError(
            [
              nuevosErrores.phone && `Teléfono: ${nuevosErrores.phone}`,
              nuevosErrores.fechaInicio &&
                `Fecha de inicio: ${nuevosErrores.fechaInicio}`,
              nuevosErrores.fechaFin &&
                `Fecha de fin: ${nuevosErrores.fechaFin}`,
            ]
              .filter(Boolean)
              .join(" "),
          );
          const primerDetalle = Object.keys(nuevosErrores).find((clave) =>
            clave.startsWith("detalles."),
          );
          if (primerDetalle)
            requestAnimationFrame(() => enfocarDetalle(primerDetalle));
          return;
        }
        setGuardando(true);
        try {
          const p = await guardarProyecto(
            {
              ...datos,
              phone: datos.phone.replace(/\D/g, ""),
              detalles: detallesPayload,
            },
            proyecto?.id,
          );
          await client.invalidateQueries({ queryKey: ["proyectos"] });
          await client.invalidateQueries({ queryKey: ["proyectos-filter"] });
          if (proyecto)
            await client.invalidateQueries({
              queryKey: ["proyectos", proyecto.id],
            });
          toast.success("Proyecto guardado correctamente");
          await navigate({
            to: "/proyectos/$proyectoId",
            params: { proyectoId: String(p.id) },
          });
        } catch (err) {
          const errores = errorProyecto(err);
          setErroresCampo(errores.campos);
          setError(errores.general ?? "");
          const primerDetalle = Object.keys(errores.campos).find((clave) =>
            clave.startsWith("detalles."),
          );
          if (primerDetalle)
            requestAnimationFrame(() => enfocarDetalle(primerDetalle));
        } finally {
          setGuardando(false);
        }
      }}
    >
      {!proyecto && (
        <p className="text-sm text-gray-500">
          Creación directa, sin cotización. Puedes agregar materiales al
          presupuesto.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {campos.map((c) => (
          <InputField
            key={c.key}
            label={`${c.label}${c.required ? " *" : ""}`}
            type={c.type ?? "text"}
            required={c.required}
            errorMessage={erroresCampo[c.key]}
            inputMode={c.key === "phone" ? "numeric" : undefined}
            maxLength={c.key === "phone" ? 9 : undefined}
            placeholder={c.key === "phone" ? "####-####" : undefined}
            min={c.key === "fechaFin" ? datos.fechaInicio : undefined}
            value={
              c.key === "phone" ? enmascararTelefono(datos.phone) : datos[c.key]
            }
            disabled={guardando}
            onChange={(e) => {
              const value =
                c.key === "phone"
                  ? enmascararTelefono(e.target.value)
                  : e.target.value;
              setDatos({ ...datos, [c.key]: value });
              setErroresCampo((actuales) => {
                const siguientes = { ...actuales };
                if (c.key === "phone" && /[^\d-]/.test(value)) {
                  siguientes.phone = "Usa solo números en el teléfono.";
                } else {
                  delete siguientes[c.key];
                }
                if (
                  (c.key === "phone" || c.key === "email") &&
                  (value.trim() ||
                    datos[c.key === "phone" ? "email" : "phone"].trim())
                ) {
                  delete siguientes.phone;
                  delete siguientes.email;
                }
                return siguientes;
              });
              const telefonoActual = c.key === "phone" ? value : datos.phone;
              setError(
                /[^\d-]/.test(telefonoActual)
                  ? "Teléfono: usa solo números y corrige el valor marcado."
                  : "",
              );
            }}
          />
        ))}
      </div>
      <p className="text-sm text-gray-500">
        Teléfono o correo: completa al menos uno. Puedes ingresar ambos.
      </p>
      <section className="space-y-4 border-t border-gray-200 pt-5">
        <div>
          <h2 className="text-lg font-semibold">Presupuesto de materiales</h2>
          <p className="text-sm text-gray-500">
            Los importes son una vista previa. Al guardar se calculan con los
            precios del servidor.
          </p>
        </div>
        {materialesQuery.isPending && <p role="status">Cargando materiales…</p>}
        {materialesQuery.isError && (
          <div role="alert" className="text-sm text-red-700">
            No se pudo cargar el catálogo de materiales.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => materialesQuery.refetch()}
            >
              Reintentar
            </button>
          </div>
        )}
        {detalles.map((detalle, index) => {
          const id = Number(detalle.materialId);
          const anterior = proyecto?.detalles.find(
            (item) => item.material.id === id,
          );
          const material = materiales.find((item) => item.id === id);
          const costo = Number(
            anterior?.costoUnitario ?? material?.costoUnitario ?? 0,
          );
          const unidad = anterior?.unidad ?? material?.unidad ?? "";
          const cantidad = Number(detalle.cantidad);
          const subtotal =
            Number.isFinite(cantidad) && cantidad > 0
              ? Math.round(cantidad * costo * 100) / 100
              : 0;
          const iva = Math.round(subtotal * 0.13 * 100) / 100;
          const opciones = materialesElegibles.filter(
            (item) =>
              item.id === id ||
              !detalles.some(
                (otro, i) => i !== index && Number(otro.materialId) === item.id,
              ),
          );
          return (
            <div
              key={index}
              className="space-y-3 rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-medium">Material {index + 1}</h3>
                <Button
                  type="button"
                  variant="secondary"
                  isDisabled={guardando}
                  onClick={() => {
                    setDetalles(detalles.filter((_, i) => i !== index));
                    limpiarErroresDetalle();
                  }}
                >
                  Quitar
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label
                  className="flex flex-col gap-1 text-sm"
                  data-campo={claveDetalle(index, "materialId")}
                >
                  Material
                  <select
                    aria-label={`Material ${index + 1}`}
                    aria-invalid={Boolean(
                      erroresCampo[claveDetalle(index, "materialId")],
                    )}
                    aria-describedby={
                      erroresCampo[claveDetalle(index, "materialId")]
                        ? `error-material-${index}`
                        : undefined
                    }
                    className="rounded-lg border border-gray-300 bg-white p-2"
                    value={detalle.materialId}
                    disabled={guardando}
                    onChange={(e) => {
                      setDetalles(
                        detalles.map((item, i) =>
                          i === index
                            ? { ...item, materialId: e.target.value }
                            : item,
                        ),
                      );
                      limpiarErrorDetalle(index, "materialId");
                    }}
                  >
                    <option value="">Selecciona un material</option>
                    {anterior && !opciones.some((item) => item.id === id) && (
                      <option value={id}>{anterior.material.nombre}</option>
                    )}
                    {opciones.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                  {erroresCampo[claveDetalle(index, "materialId")] && (
                    <span
                      id={`error-material-${index}`}
                      role="alert"
                      className="text-sm text-red-700"
                    >
                      {erroresCampo[claveDetalle(index, "materialId")]}
                    </span>
                  )}
                </label>
                <div data-campo={claveDetalle(index, "cantidad")}>
                  <InputField
                    label="Cantidad"
                    aria-label={`Cantidad del material ${index + 1}`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={detalle.cantidad}
                    disabled={guardando}
                    errorMessage={erroresCampo[claveDetalle(index, "cantidad")]}
                    onChange={(e) => {
                      setDetalles(
                        detalles.map((item, i) =>
                          i === index
                            ? { ...item, cantidad: e.target.value }
                            : item,
                        ),
                      );
                      limpiarErrorDetalle(index, "cantidad");
                    }}
                  />
                </div>
              </div>
              {id > 0 && (
                <p className="text-sm text-gray-600">
                  {unidad || "Sin unidad"} · {dinero(costo)} por unidad ·
                  Subtotal {dinero(subtotal)} · IVA {dinero(iva)} · Total{" "}
                  {dinero(subtotal + iva)}
                </p>
              )}
            </div>
          );
        })}
        <Button
          type="button"
          variant="secondary"
          isDisabled={
            guardando ||
            materialesQuery.isPending ||
            materialesQuery.isError ||
            detalles.length >= materialesElegibles.length
          }
          onClick={() =>
            setDetalles([...detalles, { materialId: "", cantidad: "1" }])
          }
        >
          Agregar material
        </Button>
        {erroresCampo.detalles && (
          <p role="alert" className="text-sm text-red-700">
            {erroresCampo.detalles}
          </p>
        )}
        {erroresDetalle.length > 0 && (
          <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <p>Corrige los siguientes materiales:</p>
            <ul className="mt-1 list-disc pl-5">
              {erroresDetalle.map(([clave, mensaje]) => (
                <li key={clave}>
                  <button
                    type="button"
                    className="text-left underline"
                    onClick={() => enfocarDetalle(clave)}
                  >
                    {etiquetaDetalle(clave)}: {mensaje}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <dl className="flex flex-wrap justify-end gap-6 border-t border-gray-200 pt-4">
          <div>
            <dt className="text-sm text-gray-500">Subtotal</dt>
            <dd className="font-semibold">{dinero(resumen.subTotal)}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">IVA</dt>
            <dd className="font-semibold">{dinero(resumen.totalIva)}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Total</dt>
            <dd className="font-semibold">
              {dinero(resumen.subTotal + resumen.totalIva)}
            </dd>
          </div>
        </dl>
      </section>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <div className="flex items-center gap-4">
        <Button type="submit" isPending={guardando} isDisabled={guardando}>
          Guardar proyecto
        </Button>
        <Link to="/proyectos" className="text-sm text-gray-600">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
