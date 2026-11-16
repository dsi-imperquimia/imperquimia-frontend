import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { FormIncidencia } from "./FormIncidencia";

const mocks = vi.hoisted(() => ({
  registrar: vi.fn(),
  actualizar: vi.fn(),
  navigate: vi.fn(),
  proyectos: vi.fn(async () => [] as unknown[]),
  actividades: vi.fn(async () => [] as unknown[]),
}));
vi.mock("../api/incidencias", async (original) => ({
  ...(await original<typeof import("../api/incidencias")>()),
  registrarIncidencia: mocks.registrar,
  actualizarIncidencia: mocks.actualizar,
  listProyectosDisponiblesIncidencia: mocks.proyectos,
}));
vi.mock("@modules/actividades-diarias/api/actividades-diarias", () => ({
  listActividadesDiarias: mocks.actividades,
  listProyectosDisponiblesActividad: mocks.proyectos,
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => (
    <a href="#">{children}</a>
  ),
  useNavigate: () => mocks.navigate,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const base = {
  id: 7,
  claveOperacion: "00000000-0000-4000-8000-000000000141",
  proyectoId: 10,
  usuarioId: 5,
  titulo: "Filtración en losa",
  descripcion: "Humedad en el segundo nivel",
  fecha: "2026-11-10T00:00:00.000Z",
  prioridad: "MEDIA" as const,
  estado: "ABIERTA" as const,
  actividadDiariaId: null,
  createdAt: "2026-11-10T00:00:00.000Z",
  updatedAt: "2026-11-10T00:00:00.000Z",
  proyecto: { id: 10, nombre: "Torre Norte" },
};

function renderForm(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>,
  );
}

it("exige proyecto, título y descripción antes de registrar", async () => {
  renderForm(<FormIncidencia />);

  fireEvent.click(screen.getByRole("button", { name: "Registrar incidencia" }));

  expect(
    await screen.findByText("Selecciona un proyecto válido."),
  ).toBeTruthy();
  expect(screen.getByText("Ingresa el título de la incidencia.")).toBeTruthy();
  expect(
    screen.getByText("Ingresa la descripción de la incidencia."),
  ).toBeTruthy();
  expect(mocks.registrar).not.toHaveBeenCalled();
});

it("en edición envía los datos recortados conservando la prioridad", async () => {
  mocks.actualizar.mockResolvedValue(base);
  renderForm(<FormIncidencia incidencia={{ ...base, prioridad: "ALTA" }} />);

  fireEvent.change(screen.getByLabelText(/Título/), {
    target: { value: "  Filtración grave  " },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

  await waitFor(() =>
    expect(mocks.actualizar).toHaveBeenCalledWith(7, {
      titulo: "Filtración grave",
      descripcion: "Humedad en el segundo nivel",
      fecha: "2026-11-10",
      prioridad: "ALTA",
    }),
  );
  expect(await screen.findByText("Cambios guardados.")).toBeTruthy();
});

it("muestra el error del backend sin perder lo escrito", async () => {
  mocks.actualizar.mockRejectedValue(
    Object.assign(new Error("x"), {
      isAxiosError: true,
      response: {
        data: { message: "Solo el jefe de proyecto asignado puede editar." },
      },
    }),
  );
  renderForm(<FormIncidencia incidencia={base} />);

  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

  expect(await screen.findByRole("alert")).toBeTruthy();
  expect((screen.getByLabelText(/Título/) as HTMLInputElement).value).toBe(
    "Filtración en losa",
  );
});

it("desde una jornada registra la incidencia vinculada y avisa sin navegar", async () => {
  const onSuccess = vi.fn();
  mocks.registrar.mockResolvedValue({
    incidencia: { ...base, id: 9, actividadDiariaId: 3 },
    repetido: false,
  });
  renderForm(
    <FormIncidencia
      embebido
      jornada={{
        id: 3,
        proyectoId: 10,
        proyectoNombre: "Torre Norte",
        fecha: "2026-11-10T00:00:00.000Z",
      }}
      onSuccess={onSuccess}
    />,
  );

  // El proyecto queda fijo: no se pide seleccionarlo.
  expect(screen.getByText("Torre Norte")).toBeTruthy();
  fireEvent.change(screen.getByLabelText(/Título/), {
    target: { value: "Cable expuesto" },
  });
  fireEvent.change(screen.getByLabelText(/Descripción/), {
    target: { value: "Cable sin protección en la azotea" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Registrar incidencia" }));

  await waitFor(() =>
    expect(mocks.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        proyectoId: 10,
        actividadDiariaId: 3,
        fecha: "2026-11-10",
        titulo: "Cable expuesto",
      }),
    ),
  );
  await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  expect(mocks.navigate).not.toHaveBeenCalled();
});

const proyectoUnico = {
  id: 10,
  nombre: "Torre Norte",
  estado: "ACTIVO",
};

async function llenarTituloYDescripcion() {
  fireEvent.change(await screen.findByLabelText(/Título/), {
    target: { value: "Cable expuesto" },
  });
  fireEvent.change(screen.getByLabelText(/Descripción/), {
    target: { value: "Cable sin protección en la azotea" },
  });
}

it("al registrar de forma independiente la actividad diaria es opcional", async () => {
  mocks.proyectos.mockResolvedValue([proyectoUnico]);
  mocks.actividades.mockResolvedValue([
    {
      id: 3,
      nombre: "Sellado de grietas",
      fecha: "2026-11-11T00:00:00.000Z",
      proyectoId: 10,
    },
  ]);
  mocks.registrar.mockResolvedValue({
    incidencia: { ...base, id: 9 },
    repetido: false,
  });
  renderForm(<FormIncidencia />);

  // Con un único proyecto se autoselecciona y aparece el campo de actividad.
  expect(await screen.findByText("Actividad diaria (opcional)")).toBeTruthy();
  await llenarTituloYDescripcion();
  fireEvent.click(screen.getByRole("button", { name: "Registrar incidencia" }));

  await waitFor(() => expect(mocks.registrar).toHaveBeenCalled());
  const payload = mocks.registrar.mock.calls[0][0];
  expect(payload.proyectoId).toBe(10);
  expect(payload.actividadDiariaId).toBeUndefined();
  expect(screen.queryByText(/Selecciona la actividad diaria/)).toBeNull();
});

it("informa sin bloquear cuando el proyecto no tiene actividades diarias", async () => {
  mocks.proyectos.mockResolvedValue([proyectoUnico]);
  mocks.actividades.mockResolvedValue([]);
  mocks.registrar.mockResolvedValue({
    incidencia: { ...base, id: 9 },
    repetido: false,
  });
  renderForm(<FormIncidencia />);

  expect(await screen.findByText(/no tiene actividades diarias/)).toBeTruthy();
  await llenarTituloYDescripcion();
  fireEvent.click(screen.getByRole("button", { name: "Registrar incidencia" }));

  await waitFor(() => expect(mocks.registrar).toHaveBeenCalled());
});
