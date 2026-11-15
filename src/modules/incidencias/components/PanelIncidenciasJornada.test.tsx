import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PanelIncidenciasJornada } from "./PanelIncidenciasJornada";

const mocks = vi.hoisted(() => ({
  listar: vi.fn(),
  vincular: vi.fn(),
}));
vi.mock("../api/incidencias", async (original) => ({
  ...(await original<typeof import("../api/incidencias")>()),
  listIncidencias: mocks.listar,
  vincularIncidenciasAJornada: mocks.vincular,
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => (
    <a href="#">{children}</a>
  ),
}));

const incidencia = (id: number, actividadDiariaId: number | null) => ({
  id,
  titulo: `Incidencia ${id}`,
  descripcion: "d",
  fecha: "2026-11-10T00:00:00.000Z",
  prioridad: "ALTA",
  estado: "ABIERTA",
  proyectoId: 10,
  actividadDiariaId,
});

function renderPanel(puedeEditar = true, puedeCrear = true) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <PanelIncidenciasJornada
        actividadId={3}
        proyectoId={10}
        proyectoNombre="Torre Norte"
        fechaJornada="2026-11-10T00:00:00.000Z"
        puedeCrear={puedeCrear}
        puedeEditar={puedeEditar}
      />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mocks.listar.mockResolvedValue([
    incidencia(1, 3), // ya vinculada a esta jornada
    incidencia(2, null), // libre
    incidencia(3, 9), // vinculada a otra jornada: no debe aparecer
  ]);
  mocks.vincular.mockResolvedValue([]);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("muestra solo incidencias libres o de esta jornada, con las vinculadas marcadas", async () => {
  renderPanel();

  expect(await screen.findByLabelText(/Incidencia 1/)).toHaveProperty(
    "checked",
    true,
  );
  expect(screen.getByLabelText(/Incidencia 2/)).toHaveProperty(
    "checked",
    false,
  );
  expect(screen.queryByText("Incidencia 3")).toBeNull();
});

it("envía el conjunto completo de incidencias seleccionadas al guardar", async () => {
  renderPanel();
  const guardar = await screen.findByRole("button", {
    name: "Guardar vínculos",
  });
  expect(guardar.hasAttribute("disabled")).toBe(true);

  fireEvent.click(screen.getByLabelText(/Incidencia 2/));
  await waitFor(() => expect(guardar.hasAttribute("disabled")).toBe(false));
  fireEvent.click(guardar);

  await waitFor(() => expect(mocks.vincular).toHaveBeenCalledWith(3, [1, 2]));
});

it("permite desvincular todas dejando la lista vacía", async () => {
  renderPanel();
  fireEvent.click(await screen.findByLabelText(/Incidencia 1/));
  fireEvent.click(screen.getByRole("button", { name: "Guardar vínculos" }));

  await waitFor(() => expect(mocks.vincular).toHaveBeenCalledWith(3, []));
});

it("ofrece crear una incidencia nueva solo con permiso de creación", async () => {
  renderPanel(true, true);
  expect(
    await screen.findByRole("button", { name: "Nueva incidencia" }),
  ).toBeTruthy();

  cleanup();
  renderPanel(true, false);
  await screen.findByLabelText(/Incidencia 1/);
  expect(screen.queryByRole("button", { name: "Nueva incidencia" })).toBeNull();
});

it("en solo lectura no ofrece guardar ni permite marcar", async () => {
  renderPanel(false);

  expect(await screen.findByLabelText(/Incidencia 1/)).toHaveProperty(
    "disabled",
    true,
  );
  expect(screen.queryByRole("button", { name: "Guardar vínculos" })).toBeNull();
});
