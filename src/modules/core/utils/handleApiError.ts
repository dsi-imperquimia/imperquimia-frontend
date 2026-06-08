// utils/errors.ts
import { notFound } from "@tanstack/react-router";
import { AxiosError } from "axios";

export const handleApiError = (error: unknown) => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;

    if (status === 404) throw notFound();
    if (status === 500)
      throw new Error(
        "Error interno del servidor (500). Por favor, intenta más tarde.",
      );
    if (status === 403)
      throw new Error("No tienes permisos para accder a este recurso (403).");
  }

  throw error;
};
