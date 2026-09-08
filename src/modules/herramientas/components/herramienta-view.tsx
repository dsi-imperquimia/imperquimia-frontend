import { Card } from "@heroui/react";
import { Button } from "@heroui/react/button";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Wrench,
  ArrowRightLeft,
  MapPin,
  Hash,
  Tag,
  Layers,
  Clock,
} from "lucide-react";
import type { Herramienta, EstadoHerramienta } from "../types/herramientas";
import type { MovimientoHerramienta } from "@modules/movimientosHerramientas/types/movimientos";
import DialogMovimientoHerramienta from "@modules/movimientosHerramientas/components/DialogMovimientoHerramienta";
import { useRouter } from "@tanstack/react-router";

// El backend retorna movimientos embebidos en findUnique
interface HerramientaConMovimientos extends Herramienta {
  movimientos?: (MovimientoHerramienta & {
    usuario: { id: number; name: string; lastName: string };
    proyectoDestino: { id: number; nombre: string } | null;
  })[];
}

interface Props {
  herramienta: HerramientaConMovimientos;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ESTADO_STYLES: Record<EstadoHerramienta, string> = {
  DISPONIBLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  EN_PROYECTO: "bg-blue-50 text-blue-700 border-blue-200",
  MANTENIMIENTO: "bg-amber-50 text-amber-700 border-amber-200",
  DANADA: "bg-rose-50 text-rose-700 border-rose-200",
  DESECHO: "bg-gray-100 text-gray-600 border-gray-300",
};

const AREA_ICON: Record<string, string> = {
  BODEGA: "🏠",
  PROYECTO: "🚧",
  TALLER: "🔧",
  DESECHO: "🗑️",
};

export function HerramientaView({ herramienta }: Props) {
  const router = useRouter();

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <Link to="/herramientas">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1 size-4" />
            Volver
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {herramienta.estado !== "DESECHO" && (
            <DialogMovimientoHerramienta
              herramienta={herramienta}
              onMovementSuccess={() => router.invalidate()}
            />
          )}

          <Link
            to="/herramientas/$herramientaId/edit"
            params={{ herramientaId: herramienta.id.toString() }}
          >
            <Button size="sm" variant="outline">
              Editar
            </Button>
          </Link>
        </div>
      </div>

      {/* Ficha del activo */}
      <Card className="w-full" variant="transparent">
        <Card.Header className="font-medium text-lg flex flex-row items-center gap-2">
          <Wrench className="text-muted inline size-5" />
          Ficha del Activo
        </Card.Header>

        <Card.Content>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <Hash className="size-3" /> Código Único
              </p>
              <p className="font-mono font-bold text-gray-950">
                {herramienta.codigoUnico}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <Wrench className="size-3" /> Nombre
              </p>
              <p className="font-medium">{herramienta.nombre}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <Tag className="size-3" /> Marca
              </p>
              <p className="font-medium">{herramienta.marca}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <Layers className="size-3" /> Tipo
              </p>
              <p className="font-medium">{herramienta.tipo}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Estado</p>
              <span
                className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                  ESTADO_STYLES[herramienta.estado]
                }`}
              >
                {herramienta.estado.replace("_", " ")}
              </span>
            </div>

            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <MapPin className="size-3" /> Ubicación actual
              </p>
              {herramienta.proyecto ? (
                <p className="font-semibold text-blue-700">
                  🚧 {herramienta.proyecto.nombre}
                </p>
              ) : (
                <p className="text-gray-600">🏠 Bodega General</p>
              )}
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Historial de movimientos */}
      <Card className="w-full" variant="transparent">
        <Card.Header className="font-medium text-lg flex flex-row items-center gap-2">
          <ArrowRightLeft className="text-muted inline size-5" />
          Historial de Traslados
          {herramienta.movimientos && (
            <span className="ml-auto text-sm font-normal text-gray-400">
              {herramienta.movimientos.length} registro
              {herramienta.movimientos.length !== 1 ? "s" : ""}
            </span>
          )}
        </Card.Header>

        <Card.Content>
          {!herramienta.movimientos || herramienta.movimientos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Clock className="size-8 mb-2 text-gray-300" />
              <p className="text-sm">Sin movimientos registrados.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Línea de tiempo vertical */}
              <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-200" />

              <ol className="space-y-5 pl-10">
                {herramienta.movimientos.map((mov) => (
                  <li key={mov.id} className="relative">
                    {/* Dot */}
                    <div className="absolute -left-6 top-1 size-3 rounded-full border-2 border-gray-300 bg-white" />

                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {AREA_ICON[mov.origen] ?? "📍"}{" "}
                          <span className="text-gray-500 font-normal">
                            {mov.origen}
                          </span>{" "}
                          →{" "}
                          {AREA_ICON[mov.destino] ?? "📍"}{" "}
                          <span className="text-blue-700">{mov.destino}</span>
                          {mov.proyectoDestino && (
                            <span className="text-gray-500 font-normal text-xs ml-1">
                              ({mov.proyectoDestino.nombre})
                            </span>
                          )}
                        </p>

                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                            ESTADO_STYLES[
                              mov.estadoHerramienta as EstadoHerramienta
                            ] ?? ""
                          }`}
                        >
                          {mov.estadoHerramienta.replace("_", " ")}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                        <span>
                          👤 {mov.usuario.name} {mov.usuario.lastName}
                        </span>
                        <span>🕐 {formatDate(mov.fechaMovimiento)}</span>
                      </div>

                      {mov.observaciones && (
                        <p className="text-xs text-gray-600 bg-white border border-gray-100 rounded-lg px-3 py-2 mt-1">
                          📝 {mov.observaciones}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
