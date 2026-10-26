import { createFileRoute } from "@tanstack/react-router";
import {
  createTipoHerramienta,
  listTiposHerramienta,
  setTipoHerramientaActivo,
  updateTipoHerramienta,
} from "@modules/herramientas/api/tiposHerramienta";
import { CatalogoHerramienta } from "@modules/herramientas/components/CatalogoHerramienta";

export const Route = createFileRoute("/_authenticated/herramientas/tipos")({
  component: TiposHerramientaPage,
});

function TiposHerramientaPage() {
  return (
    <CatalogoHerramienta
      config={{
        titulo: "Tipos de herramienta",
        descripcion:
          "Los tipos desactivados permanecen en las herramientas existentes, pero no se pueden elegir al registrar nuevas herramientas.",
        singular: "tipo",
        genero: "m",
        ejemplo: "Ej. Eléctrica",
        longitudMaxima: 80,
        queryKey: "tipos-herramienta",
        listar: listTiposHerramienta,
        crear: createTipoHerramienta,
        actualizar: updateTipoHerramienta,
        cambiarEstado: setTipoHerramientaActivo,
      }}
    />
  );
}
