import { AxiosError } from "axios";

/**
 * Posible respuesta de error:
 * {
 *   "message": {
 *     "email": [
 *       "El correo electrónico ya está en uso"
 *     ]
 *   },
 *   "error": "Conflict",
 *   "statusCode": 409
 *  }
 */
export function parseErrorApiUseForm(
  error: any,
  defaultMessage = "Error al guardar los datos",
) {
  const message =
    error instanceof AxiosError && error.response?.data?.message
      ? error.response?.data?.message
      : defaultMessage;

  return {
    onSubmit: {
      form: typeof message === "string" ? message : defaultMessage,
      fields:
        typeof message === "object"
          ? (message as Record<string, string[]>)
          : {},
    },
  };
}
