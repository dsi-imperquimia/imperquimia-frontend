import { Card } from "@heroui/react/card";
import { FormCotizacion } from "@modules/cotizacion/components/cotizacion-form";
import { createFileRoute } from "@tanstack/react-router";
import { FilePlus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cotizaciones/create")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Card className="w-full" variant="transparent">
      <Card.Header className="font-medium text-lg flex flex-row items-center gap-2">
        <FilePlus className="text-muted inline" />
        Crear cotización
      </Card.Header>

      <Card.Content>
        <FormCotizacion />
      </Card.Content>
    </Card>
  );
}