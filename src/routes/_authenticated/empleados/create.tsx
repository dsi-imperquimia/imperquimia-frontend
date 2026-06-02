import { Card } from "@heroui/react/card";
import { FormEmpleado } from "@modules/empleados/components/FormEmpleado";
import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/empleados/create")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Card className="w-full max-w-md" variant="transparent">
      <Card.Header className="font-medium text-lg flex flex-row items-center gap-2">
        <UserPlus className="text-muted inline" />
        Crear empleado
      </Card.Header>
      <Card.Content>
        <FormEmpleado />
      </Card.Content>
    </Card>
  );
}
