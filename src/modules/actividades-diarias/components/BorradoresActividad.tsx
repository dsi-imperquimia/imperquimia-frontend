import { Button } from "@heroui/react/button";
import { fecha } from "@modules/proyectos/types/proyectos";
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
      className="rounded-xl border border-gray-200 bg-white p-6"
    >
      <h2 className="text-lg font-semibold">
        Borradores ({borradores.length})
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Se reenviarán automáticamente al recuperar la conexión y se eliminarán
        al guardarse.
      </p>

      <ul className="mt-4 divide-y divide-gray-200">
        {borradores.map((borrador) => {
          const procesando =
            Boolean(isReenviandoTodos) ||
            claveEnProceso === borrador.claveOperacion;
          return (
            <li
              key={borrador.claveOperacion}
              className="flex flex-wrap items-center justify-between gap-2 py-3"
            >
              <div>
                <p className="font-medium">
                  {borrador.proyectoNombre ??
                    `Proyecto #${borrador.payload.proyectoId}`}
                </p>
                <p className="text-sm text-gray-500">
                  {fecha(borrador.payload.fecha)} ·{" "}
                  {borrador.payload.descripcion}
                </p>
                {borrador.ultimoError && (
                  <p role="alert" className="mt-1 text-sm text-red-700">
                    {borrador.ultimoError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  isPending={procesando}
                  isDisabled={procesando}
                  onClick={() => void onReenviar(borrador)}
                >
                  Reenviar
                </Button>
                <Button
                  type="button"
                  variant="tertiary"
                  isDisabled={procesando}
                  onClick={() => onDescartar(borrador.claveOperacion)}
                >
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
