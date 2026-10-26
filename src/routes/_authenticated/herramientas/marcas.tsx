import { createFileRoute } from "@tanstack/react-router";
import {
  createMarcaHerramienta,
  listMarcasHerramienta,
  setMarcaHerramientaActiva,
  updateMarcaHerramienta,
} from "@modules/herramientas/api/marcasHerramienta";
import { CatalogoHerramienta } from "@modules/herramientas/components/CatalogoHerramienta";

export const Route = createFileRoute("/_authenticated/herramientas/marcas")({
  component: MarcasHerramientaPage,
});

function MarcasHerramientaPage() {
  return (
    <CatalogoHerramienta
      config={{
        titulo: "Marcas de herramientas",
        descripcion:
          "Las marcas desactivadas permanecen en las herramientas existentes, pero no se pueden elegir al registrar nuevas herramientas.",
        singular: "marca",
        genero: "f",
        ejemplo: "Ej. Bosch",
        longitudMaxima: 100,
        queryKey: "marcas-herramienta",
        listar: listMarcasHerramienta,
        crear: createMarcaHerramienta,
        actualizar: updateMarcaHerramienta,
        cambiarEstado: setMarcaHerramientaActiva,
      }}
    />
  );
}
