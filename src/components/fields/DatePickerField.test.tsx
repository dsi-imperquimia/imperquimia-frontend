import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { DatePickerField } from "./DatePickerField";

afterEach(cleanup);

function segmentos() {
  return screen.getAllByRole("spinbutton");
}

it("muestra la fecha recibida en formato AAAA-MM-DD", () => {
  render(
    <DatePickerField label="Fecha" value="2026-11-10" onChange={() => {}} />,
  );

  const valores = segmentos().map((s) => s.getAttribute("aria-valuenow"));
  expect(valores).toContain("10");
  expect(valores).toContain("11");
  expect(valores).toContain("2026");
});

it("devuelve el cambio como texto AAAA-MM-DD", () => {
  const onChange = vi.fn();
  render(
    <DatePickerField label="Fecha" value="2026-11-10" onChange={onChange} />,
  );

  const dia = segmentos().find((s) => s.getAttribute("aria-valuenow") === "10");
  expect(dia).toBeTruthy();
  fireEvent.keyDown(dia!, { key: "ArrowUp" });

  expect(onChange).toHaveBeenCalledWith("2026-11-11");
});

it("muestra el mensaje de error recibido", () => {
  render(
    <DatePickerField
      label="Fecha"
      value=""
      onChange={() => {}}
      errorMessage="La fecha no puede ser futura."
    />,
  );

  expect(screen.getByText("La fecha no puede ser futura.")).toBeTruthy();
});
