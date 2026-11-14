import { Button } from "@heroui/react/button";
import { RefreshCw, Trash2 } from "lucide-react";
import type { BorradorActividad } from "../types/actividad-diaria";

export function BorradoresActividad({
  borradores,
  claveEnProceso,
  isReenviandoTodos,
  onReenviar,
  onDescartar,
}: {
  borradores: BorradorActividad[];
  claveEnProceso?: string | null;
  isReenviandoTodos?: boolean;
  onReenviar: (borrador: BorradorActividad) => Promise<void> | void;
  onDescartar: (claveOperacion: string) => void;
}) {
  if (borradores.length === 0) return null;

  return (
    <section
      aria-label="Borradores pendientes"
      className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-amber-950">
            Borradores ({borradores.length})
          </h2>
          <p className="text-xs text-amber-800">
            Se reenviarán automáticamente al recuperar la conexión y se
            eliminarán al guardarse.
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {borradores.map((borrador) => {
          const procesando =
            Boolean(isReenviandoTodos) ||
            claveEnProceso === borrador.claveOperacion;
          return (
            <li
              key={borrador.claveOperacion}
              className="flex flex-col justify-between gap-3 rounded-lg border border-amber-200 bg-white p-3 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-900">
                  <span>
                    {borrador.proyectoNombre ??
                      `Proyecto #${borrador.payload.proyectoId}`}
                  </span>
                  <span className="text-xs font-normal text-gray-500">
                    · {borrador.payload.fecha}
                  </span>
                </div>
                <p className="truncate text-sm text-gray-700">
                  {borrador.payload.descripcion}
                </p>
                {borrador.ultimoError && (
                  <p className="text-xs text-red-700" role="alert">
                    {borrador.ultimoError}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  isPending={procesando}
                  isDisabled={procesando}
                  onClick={() => void onReenviar(borrador)}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reenviar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="tertiary"
                  isDisabled={procesando}
                  onClick={() => onDescartar(borrador.claveOperacion)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Descartar
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
