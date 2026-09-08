import { Card } from "@heroui/react/card";
import { FormCargoEmpleado } from "@modules/cargo-empleado/components/FormCargoEmpleado";
import { createFileRoute } from "@tanstack/react-router";
import { Briefcase } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cargo-empleado/create")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Card className="w-full max-w-md" variant="transparent">
      <Card.Header className="font-medium text-lg flex flex-row items-center gap-2">
        <Briefcase className="text-muted inline" />
        Crear cargo de empleado
      </Card.Header>
      <Card.Content>
        <FormCargoEmpleado />
      </Card.Content>
    </Card>
  );
}
