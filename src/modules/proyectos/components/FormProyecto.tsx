import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@heroui/react/button";
import { toast } from "@heroui/react/toast";
import { InputField } from "@components/fields/InputField";
import { guardarProyecto, errorProyecto } from "../api/guardarProyecto";
import type { DatosProyecto } from "../api/guardarProyecto";
import type { Proyecto } from "../types/proyectos";
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
      onSubmit={async (e) => {
        e.preventDefault();
        if (guardando) return;
        setError("");
        if (!datos.nombre.trim() || !datos.cliente.trim()) {
          setError("Nombre y cliente son obligatorios.");
          return;
        }
        if (!datos.phone.trim() && !datos.email.trim()) {
          setError("Ingresa al menos un teléfono o correo.");
          return;
        }
        if (
          !datos.fechaInicio ||
          !datos.fechaFin ||
          datos.fechaFin < datos.fechaInicio
        ) {
          setError(
            "Revisa las fechas: el fin no puede ser anterior al inicio.",
          );
          return;
        }
        setGuardando(true);
        try {
          const p = await guardarProyecto(datos, proyecto?.id);
          await client.invalidateQueries({ queryKey: ["proyectos"] });
          await client.invalidateQueries({ queryKey: ["proyectos-filter"] });
          toast.success("Proyecto guardado correctamente");
          await navigate({
            to: "/proyectos/$proyectoId",
            params: { proyectoId: String(p.id) },
          });
        } catch (err) {
          setError(errorProyecto(err));
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
            min={c.key === "fechaFin" ? datos.fechaInicio : undefined}
            value={datos[c.key]}
            disabled={guardando}
            onChange={(e) => setDatos({ ...datos, [c.key]: e.target.value })}
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
