/**
 * Aplica una máscara donde cada "0" representa un dígito.
 * Los separadores se insertan conforme el usuario escribe.
 */
function applyMask(value: string, mask: string): string {
  const digits = value.replace(/\D/g, "");
  let result = "";
  let digitIndex = 0;

  for (const char of mask) {
    if (digitIndex >= digits.length) break;
    if (char === "0") {
      result += digits[digitIndex++];
    } else {
      result += char;
    }
  }

  return result;
}

export const DUI_MASK = "00000000-0";
export const NIT_MASK = "0000-000000-000-0";

/** Formatea un DUI de El Salvador: 00000000-0 */
export function formatDui(value: string): string {
  return applyMask(value, DUI_MASK);
}

/**
 * Formatea un NIT de El Salvador. Acepta ambos formatos vigentes:
 * - Homologado con DUI (personas naturales): 00000000-0
 * - Tradicional: 0000-000000-000-0
 * Con 9 dígitos o menos usa el formato de DUI; al pasar de 9 cambia al tradicional.
 */
export function formatNit(value: string): string {
  const digits = value.replace(/\D/g, "");
  return applyMask(digits, digits.length <= 9 ? DUI_MASK : NIT_MASK);
}

/** Valida formato y dígito verificador del DUI. */
export function isValidDui(value: string): boolean {
  if (!/^\d{8}-\d$/.test(value)) return false;

  const digits = value.replace("-", "").split("").map(Number);
  const sum = digits
    .slice(0, 8)
    .reduce((acc, digit, index) => acc + digit * (9 - index), 0);
  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === digits[8];
}

/** Valida NIT: formato de DUI (con dígito verificador) o formato tradicional. */
export function isValidNit(value: string): boolean {
  return isValidDui(value) || /^\d{4}-\d{6}-\d{3}-\d$/.test(value);
}
