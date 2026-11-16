import { ActividadesDiariasPage } from "@modules/actividades-diarias/components/ActividadesDiariasPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/actividades-diarias/")({
  component: ActividadesDiariasPage,
});
