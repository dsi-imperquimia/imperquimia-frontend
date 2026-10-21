import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { InputField } from "@components/fields/InputField";
import { guardarProyecto, errorProyecto } from "../api/guardarProyecto";
import type { DatosProyecto, ErroresProyecto } from "../api/guardarProyecto";
import type { Proyecto } from "../types/proyectos";

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

export function FormProyecto({ proyecto }: { proyecto?: Proyecto }) {
  const [datos, setDatos] = useState<DatosProyecto>({
    nombre: proyecto?.nombre ?? "",
    cliente: proyecto?.cliente ?? "",
    descripcion: proyecto?.descripcion ?? "",
    ubicacion: proyecto?.ubicacion ?? "",
    phone: proyecto?.phone ?? "",
    email: proyecto?.email ?? "",
    fechaInicio: proyecto?.fechaInicio?.slice(0, 10) ?? "",
    fechaFin: proyecto?.fechaFin?.slice(0, 10) ?? "",
  });
  const [error, setError] = useState("");
  const [erroresCampo, setErroresCampo] = useState<ErroresProyecto["campos"]>(
    {},
  );
  const [guardando, setGuardando] = useState(false);
  const navigate = useNavigate();
  const client = useQueryClient();
  const campos: {
    key: keyof DatosProyecto;
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
          return;
        }
        setGuardando(true);
        try {
          const p = await guardarProyecto(
            { ...datos, phone: datos.phone.replace(/\D/g, "") },
            proyecto?.id,
          );
          await client.invalidateQueries({ queryKey: ["proyectos"] });
          await client.invalidateQueries({ queryKey: ["proyectos-filter"] });
          toast.success("Proyecto guardado correctamente");
          await navigate({
            to: "/proyectos/$proyectoId",
            params: { proyectoId: String(p.id) },
          });
        } catch (err) {
          const errores = errorProyecto(err);
          setErroresCampo(errores.campos);
          setError(errores.general ?? "");
        } finally {
          setGuardando(false);
        }
      }}
    >
      {!proyecto && (
        <p className="text-sm text-gray-500">
          Creación directa, sin cotización. El proyecto inicia activo y con
          presupuesto de materiales en cero.
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
