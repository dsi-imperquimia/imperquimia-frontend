/**
 * crypto.randomUUID solo existe en contextos seguros (HTTPS o localhost);
 * si la app se sirve por HTTP en otro host, no está disponible. En cambio
 * crypto.getRandomValues no tiene esa restricción, así que se usa para
 * construir el UUID v4 manualmente (mismo algoritmo que implementa la
 * propia especificación). Math.random queda solo como último recurso para
 * entornos sin ninguna de las dos APIs.
 */
function uuidV4ConGetRandomValues(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // versión 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante RFC 4122
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

function uuidV4ConMathRandom(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const aleatorio = (Math.random() * 16) | 0;
    const valor = c === "x" ? aleatorio : (aleatorio & 0x3) | 0x8;
    return valor.toString(16);
  });
}

/** Genera una clave de operación (UUID v4) para idempotencia en creaciones. */
export function nuevaClaveOperacion(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    return uuidV4ConGetRandomValues();
  }
  return uuidV4ConMathRandom();
}
