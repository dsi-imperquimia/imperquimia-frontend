import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { BotonEliminarIncidencia } from "./BotonEliminarIncidencia";

const mocks = vi.hoisted(() => ({
  eliminar: vi.fn(),
  navigate: vi.fn(),
  toast: { success: vi.fn(), danger: vi.fn() },
}));
vi.mock("../api/incidencias", async (original) => ({
  ...(await original<typeof import("../api/incidencias")>()),
  eliminarIncidencia: mocks.eliminar,
}));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
}));
vi.mock("@heroui/react/toast", () => ({ toast: mocks.toast }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const incidencia = {
  id: 7,
  titulo: "Filtración en losa",
  actividadDiaria: { id: 3, nombre: "Sellado de grietas", fecha: "2026-11-11" },
};

function renderBoton(
  props: Partial<React.ComponentProps<typeof BotonEliminarIncidencia>> = {},
) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <BotonEliminarIncidencia incidencia={incidencia} {...props} />
    </QueryClientProvider>,
  );
}

it("pide confirmación y no elimina hasta confirmar", async () => {
  renderBoton();

  fireEvent.click(screen.getByRole("button", { name: "Eliminar incidencia" }));

  expect(await screen.findByText("¿Eliminar incidencia?")).toBeTruthy();
  expect(screen.getByText(/dejará de aparecer en la actividad/)).toBeTruthy();
  expect(mocks.eliminar).not.toHaveBeenCalled();
});

it("elimina, avisa y vuelve al listado al confirmar", async () => {
  mocks.eliminar.mockResolvedValue({ id: 7 });
  renderBoton();

  fireEvent.click(screen.getByRole("button", { name: "Eliminar incidencia" }));
  fireEvent.click(await screen.findByRole("button", { name: "Eliminar" }));

  await waitFor(() => expect(mocks.eliminar).toHaveBeenCalledWith(7));
  await waitFor(() =>
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/incidencias" }),
  );
  expect(mocks.toast.success).toHaveBeenCalled();
});

it("si falla muestra el error y no navega", async () => {
  mocks.eliminar.mockRejectedValue(new Error("boom"));
  renderBoton();

  fireEvent.click(screen.getByRole("button", { name: "Eliminar incidencia" }));
  fireEvent.click(await screen.findByRole("button", { name: "Eliminar" }));

  await waitFor(() => expect(mocks.toast.danger).toHaveBeenCalled());
  expect(mocks.navigate).not.toHaveBeenCalled();
});

it("en el listado (tamaño pequeño) elimina sin navegar", async () => {
  mocks.eliminar.mockResolvedValue({ id: 7 });
  renderBoton({ size: "sm", volverAlListado: false });

  fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
  fireEvent.click(
    (await screen.findAllByRole("button", { name: "Eliminar" })).at(-1)!,
  );

  await waitFor(() => expect(mocks.eliminar).toHaveBeenCalledWith(7));
  await waitFor(() => expect(mocks.toast.success).toHaveBeenCalled());
  expect(mocks.navigate).not.toHaveBeenCalled();
});
