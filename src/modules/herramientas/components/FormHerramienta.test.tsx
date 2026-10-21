import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { FormHerramienta } from "./FormHerramienta";

const mocks = vi.hoisted(() => ({ crear: vi.fn() }));
vi.mock("../api/createHerramienta", () => ({ createHerramienta: mocks.crear }));
vi.mock("../api/marcasHerramienta", () => ({
  listMarcasHerramienta: async () => [
    { id: 7, nombre: "Bosch", activo: true },
    { id: 8, nombre: "Antigua", activo: false },
  ],
}));
vi.mock("../api/tiposHerramienta", () => ({
  listTiposHerramienta: async () => [
    { id: 3, nombre: "Eléctrica", activo: true },
  ],
}));
vi.mock("@heroui/react/toast", () => ({ toast: { success: vi.fn() } }));

afterEach(cleanup);

it("envía los identificadores de marca y tipo activos al registrar una herramienta", async () => {
  mocks.crear.mockResolvedValue({
    id: 1,
    nombre: "Taladro",
    codigoUnico: "HERR-0001",
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <FormHerramienta />
    </QueryClientProvider>,
  );

  fireEvent.change(screen.getByLabelText("Nombre de la Herramienta"), {
    target: { value: "Taladro" },
  });
  const marca = await screen.findByLabelText("Marca de herramienta");
  const tipo = await screen.findByLabelText("Tipo de herramienta");
  await waitFor(() => expect(marca.hasAttribute("disabled")).toBe(false));
  expect(screen.queryByRole("option", { name: /Antigua/ })).toBeNull();
  fireEvent.change(marca, { target: { value: "7" } });
  fireEvent.change(tipo, { target: { value: "3" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar herramienta" }));

  await waitFor(() =>
    expect(mocks.crear).toHaveBeenCalledWith({
      nombre: "Taladro",
      marcaId: 7,
      tipoId: 3,
    }),
  );
});
