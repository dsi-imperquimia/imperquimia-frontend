import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Chip } from "@heroui/react/chip";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { listMisAsignaciones } from "@modules/mis-asignaciones/api/misAsignaciones";
import type { PrioridadAsignacion } from "@modules/mis-asignaciones/types/asignacion";
import { fecha } from "@modules/proyectos/types/proyectos";
import axios from "axios";
import { CheckCircle2, MapPin } from "lucide-react";

const ESTADO_LABEL: Record<string, string> = {
  GARANTIA: "GARANTÍA",
  EN_PAUSA: "EN PAUSA",
};

const PRIORIDAD_LABEL: Record<PrioridadAsignacion, string> = {
  ALTA: "Prioridad alta",
  MEDIA: "Prioridad media",
  BAJA: "Prioridad baja",
};

const PRIORIDAD_COLOR: Record<
  PrioridadAsignacion,
  "danger" | "warning" | "default"
> = {
  ALTA: "danger",
  MEDIA: "warning",
  BAJA: "default",
};

export const Route = createFileRoute("/_authenticated/mis-proyectos/")({
  component: MisProyectos,
});

function MisProyectos() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["mis-asignaciones"],
    queryFn: listMisAsignaciones,
  });

  if (isPending) return <p role="status">Cargando tus proyectos…</p>;
  if (isError) {
    const sinEmpleado = axios.isAxiosError(error) && error.response?.status === 403;
    return (
      <div role="alert">
        {sinEmpleado ? (
          "Tu usuario no está vinculado a un empleado, así que no tienes proyectos que mostrar aquí."
        ) : (
          <>
            No se pudieron cargar tus proyectos asignados.{" "}
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </>
        )}
      </div>
    );
  }

  const { items, pendientes } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          Mis proyectos
          {pendientes > 0 && (
            <Chip color="warning" size="sm">
              {pendientes} pendiente{pendientes > 1 ? "s" : ""}
            </Chip>
          )}
        </h1>
        <p className="text-sm text-gray-500">
          Proyectos donde tienes una asignación vigente.
        </p>
      </div>
      {items.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          No tienes proyectos asignados por el momento.
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to="/mis-proyectos/$proyectoId"
                params={{ proyectoId: String(item.id) }}
                className="block h-full"
              >
                <Card className="h-full gap-2 hover:border-gray-300 hover:shadow-sm">
                  <Card.Header className="flex-row items-start justify-between gap-2">
                    <Card.Title>{item.nombre}</Card.Title>
                    {item.vista ? (
                      <Chip size="sm">
                        <CheckCircle2 className="size-3.5" />
                        Vista
                      </Chip>
                    ) : (
                      <Chip color="warning" size="sm">
                        Pendiente
                      </Chip>
                    )}
                  </Card.Header>
                  <Card.Content className="gap-1">
                    <p className="flex items-center gap-1.5 text-sm text-gray-500">
                      <MapPin className="size-3.5" />
                      {item.ubicacion || "Sin ubicación"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {ESTADO_LABEL[item.estado] ?? item.estado} ·{" "}
                      {fecha(item.fechaInicio)} – {fecha(item.fechaFin)}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Chip color={PRIORIDAD_COLOR[item.prioridad]} size="sm" className="w-fit">
                        {PRIORIDAD_LABEL[item.prioridad]}
                      </Chip>
                      {item.esJefe && (
                        <Chip color="accent" size="sm" className="w-fit">
                          Jefe de proyecto
                        </Chip>
                      )}
                    </div>
                  </Card.Content>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
