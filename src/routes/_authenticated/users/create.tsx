import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/users/create")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div></div>;
}
